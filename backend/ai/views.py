"""
Django views for the AI endpoints.

POST /api/ai/regulatory-query/
POST /api/ai/harvest-forecast/
"""

import json
import hashlib
from datetime import date, timedelta
from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from django.conf import settings
from django.utils import timezone

from .models import AIQueryLog
from .retrieval.retriever import retrieve, lookup_withdrawal_period, lookup_mrl
from .llm.router import classify_query
from .llm.generator import generate_response, generate_structured_response
from amu_monitoring.utils import login_required_json

RATE_LIMIT_PER_DAY = getattr(settings, 'AI_RATE_LIMIT_PER_DAY', 20)
CONFIDENCE_THRESHOLD = 0.72
GEMINI_MODEL = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')


def _check_rate_limit(user) -> bool:
    """
    Returns True if user is within their daily AI query limit.
    Uses atomic cache increment to prevent pulse-rate race conditions.
    """
    key = f"ai_limit_{user.id}_{timezone.now().date()}"
    limit = getattr(settings, 'AI_RATE_LIMIT_PER_DAY', 20)
    
    try:
        # Get or set initial value
        current = cache.get(key)
        if current is None:
            cache.set(key, 1, timeout=86400)
            return True
            
        if current >= limit:
            return False
            
        # Atomic increment
        cache.incr(key)
        return True
    except Exception:
        # If cache fails, fallback to DB check (safer than failing open)
        today = timezone.now().date()
        count = AIQueryLog.objects.filter(user=user, created_at__date=today).count()
        return count < limit


def _cache_key(query: str, species: str = '', molecule: str = '') -> str:
    raw = f"{query.lower().strip()}|{species}|{molecule}"
    return 'ai_cache_' + hashlib.md5(raw.encode()).hexdigest()


@method_decorator(login_required_json, name='dispatch')
@method_decorator(csrf_exempt, name='dispatch')
class RegulatoryQueryView(View):
    """
    POST /api/ai/regulatory-query/
    Auth: JWT required
    Body: { "query": str, "species": "AVI"|"BOV"|"OVI" (optional) }
    """

    def post(self, request):
        if not _check_rate_limit(request.user):
            return JsonResponse(
                {'error': f'Daily AI query limit ({RATE_LIMIT_PER_DAY}) reached. Try again tomorrow.'},
                status=429
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)

        query = data.get('query', '').strip()
        species = data.get('species', '').strip().upper()

        if not query:
            return JsonResponse({'error': 'query field is required.'}, status=400)

        # Check cache (same query + species = same answer for 24h)
        cache_key = _cache_key(query, species)
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse(cached, status=200)

        # Step 1: Route the query
        route = classify_query(query)
        
        # Step 2: Retrieve relevant chunks
        # We retrieve early to implement a "Safety Net": 
        # If the router says out_of_scope but retrieval is very high confidence (>0.8), 
        # we assume the router hallucinated and proceed anyway.
        retrieval = retrieve(
            query=query,
            species_filter=species if species else None,
            source_type_filter='regulatory',
            top_k=5
        )

        if retrieval.get('error'):
            return JsonResponse({'error': retrieval['error']}, status=503)

        # Safety Net Logic:
        is_high_sim = retrieval.get('max_similarity', 0) > 0.8
        
        if route['intent'] == 'out_of_scope' and not is_high_sim:
            return JsonResponse({
                'answer': 'This question is outside the scope of the AMU regulatory assistant. Please ask about antimicrobial regulations, MRL limits, or drug categorizations.',
                'confidence': 1.0,
                'source': None,
                'flagged_for_review': False,
            }, status=200)

        # Step 3: Generate grounded response
        result = generate_response(
            query=query,
            chunks=retrieval['chunks'],
            max_similarity=retrieval['max_similarity'],
        )

        response_data = {
            'answer': result['answer'],
            'confidence': result['confidence'],
            'source': result['source'],
            'flagged_for_review': result['flagged_for_review'],
        }

        # Log the query
        AIQueryLog.objects.create(
            user=request.user,
            query_type='regulatory',
            query_text=query,
            species=species or None,
            response_text=result['answer'],
            confidence=result['confidence'],
            source_citation=result['source'],
            flagged_for_review=result['flagged_for_review'],
            retrieved_chunk_ids=[c['metadata'].get('chunk_id', '') for c in retrieval['chunks']],
            model_version=GEMINI_MODEL,
        )

        # Cache successful, non-flagged responses
        if not result['flagged_for_review']:
            cache.set(cache_key, response_data, timeout=86400)  # 24h

        return JsonResponse(response_data, status=200)


@method_decorator(login_required_json, name='dispatch')
@method_decorator(csrf_exempt, name='dispatch')
class HarvestForecastView(View):
    """
    POST /api/ai/harvest-forecast/
    Auth: JWT required
    Body: { "molecule": str, "species": str, "treatment_date": "YYYY-MM-DD", "dosage": float }

    Strategy:
        1. Try direct CSV lookup for withdrawal period (fastest, most reliable)
        2. If not in CSV, fall back to RAG retrieval of pharmacokinetic literature
        3. Math is always done in Python — NEVER by the LLM
    """

    def post(self, request):
        if not _check_rate_limit(request.user):
            return JsonResponse(
                {'error': f'Daily AI query limit ({RATE_LIMIT_PER_DAY}) reached.'},
                status=429
            )

        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)

        molecule = data.get('molecule', '').strip()
        species = data.get('species', '').strip().upper()
        treatment_date_str = data.get('treatment_date', '').strip()
        dosage = data.get('dosage')

        if not all([molecule, species, treatment_date_str]):
            return JsonResponse(
                {'error': 'molecule, species, and treatment_date are required.'},
                status=400
            )

        try:
            treatment_date = date.fromisoformat(treatment_date_str)
        except ValueError:
            return JsonResponse({'error': 'treatment_date must be YYYY-MM-DD format.'}, status=400)

        # Cache key
        cache_key = _cache_key(molecule, species, treatment_date_str)
        cached = cache.get(cache_key)
        if cached:
            return JsonResponse(cached, status=200)

        # ── Step 1: Direct CSV lookup (preferred — no LLM) ────────────────────
        csv_result = lookup_withdrawal_period(molecule, species)

        if csv_result:
            withdrawal_days = int(csv_result.get('withdrawal_period_days', 0))
            safe_date = treatment_date + timedelta(days=withdrawal_days)

            response_data = {
                'safe_harvest_date': safe_date.isoformat(),
                'withdrawal_days': withdrawal_days,
                'half_life_source': f"molecule_withdrawal_periods.csv (direct data for {molecule}, {species})",
                'confidence': 1.0,
                'flagged_for_review': False,
                'method': 'csv_direct_lookup',
            }

            AIQueryLog.objects.create(
                user=request.user,
                query_type='harvest_forecast',
                query_text=f"Harvest forecast: {molecule} / {species} / {treatment_date_str}",
                species=species,
                molecule=molecule,
                response_text=str(response_data),
                confidence=1.0,
                source_citation='molecule_withdrawal_periods.csv',
                flagged_for_review=False,
                retrieved_chunk_ids=[],
                model_version='csv_lookup',
            )

            cache.set(cache_key, response_data, timeout=86400)
            return JsonResponse(response_data, status=200)

        # ── Step 2: RAG fallback for molecules not in CSV ──────────────────────
        rag_query = f"withdrawal period for {molecule} in {species} animals"
        retrieval = retrieve(
            query=rag_query,
            species_filter=species,
            source_type_filter='pharmacokinetic',
            top_k=3
        )

        if retrieval.get('error') or not retrieval['chunks']:
            return JsonResponse({
                'safe_harvest_date': None,
                'confidence': 0.0,
                'flagged_for_review': True,
                'error': f'No withdrawal data found for {molecule} ({species}). Please consult a veterinarian.',
            }, status=200)

        # Let LLM extract the withdrawal period from PK chunks using structured output
        result = generate_structured_response(
            query=rag_query,
            chunks=retrieval['chunks'],
            max_similarity=retrieval['max_similarity'],
        )

        # Python does the math — LLM only provides extraction
        withdrawal_days = result.get('withdrawal_days')
        if isinstance(withdrawal_days, (int, float)) and not result.get('flagged_for_review'):
            withdrawal_days = int(withdrawal_days)
            safe_date = treatment_date + timedelta(days=withdrawal_days)
        else:
            # Cannot safely compute — flag it
            withdrawal_days = withdrawal_days
            safe_date = None

        response_data = {
            'safe_harvest_date': safe_date.isoformat() if safe_date else None,
            'withdrawal_days': withdrawal_days,
            'half_life_source': result.get('source'),
            'confidence': retrieval['max_similarity'],
            'flagged_for_review': result.get('flagged_for_review') or safe_date is None,
            'method': 'rag_retrieval',
            'rag_context_summary': result.get('reasoning'),
        }

        AIQueryLog.objects.create(
            user=request.user,
            query_type='harvest_forecast',
            query_text=f"Harvest forecast: {molecule} / {species} / {treatment_date_str}",
            species=species,
            molecule=molecule,
            response_text=str(response_data),
            confidence=retrieval.get('max_similarity', 0.0), # Use retrieval similarity
            source_citation=result.get('source'),
            flagged_for_review=response_data['flagged_for_review'],
            retrieved_chunk_ids=[c['metadata'].get('chunk_id', '') for c in retrieval['chunks']],
            model_version=GEMINI_MODEL,
        )

        if not response_data['flagged_for_review']:
            cache.set(cache_key, response_data, timeout=86400)

        return JsonResponse(response_data, status=200)
