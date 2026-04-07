"""
LLM Query Router
Classifies user intent before retrieval to prevent chunk mixing.
Uses Gemini 3.1 Flash Lite — free tier, fast, consistent JSON output.
"""

import json
import logging
from openai import OpenAI
from django.conf import settings
from pydantic import BaseModel

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    """Lazy-loaded OpenAI client singleton."""
    global _client
    if _client is None:
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            logger.error("OPENAI_API_KEY not configured.")
            return None
        _client = OpenAI(api_key=api_key)
    return _client


class RouterResponse(BaseModel):
    intent: str
    confidence: float

ROUTER_SYSTEM_PROMPT = """You are a query classifier for an antimicrobial usage (AMU) monitoring system.
Classify the user query into exactly one of these categories:

- "regulatory": Questions about regulations, guidelines, MRL limits, antimicrobial resistance (AMR) policy, or the classification of drugs into categories (e.g., "Highly Important", "Critically Important", "HPCIA"). This includes WHO/WOAH/EMA prioritization lists and prohibited substances in livestock.
- "pharmacokinetic": Questions about withdrawal periods, half-life, dosage, tissue residues, safe harvest dates, or drug clearance in animals.
- "out_of_scope": Any question unrelated to antimicrobial use in livestock, veterinary medicine, public health policy related to AMR, or food safety.

Respond ONLY with valid JSON in this exact format (no explanation, no markdown, no code fences):
{"intent": "regulatory" | "pharmacokinetic" | "out_of_scope", "confidence": 0.0-1.0}
"""


def classify_query(query: str) -> dict:
    """
    Classifies query intent using OpenAI with strict JSON output via structured outputs.
    """
    client = _get_client()
    if not client:
        return {'intent': 'regulatory', 'confidence': 0.5}

    try:
        response = client.beta.chat.completions.parse(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": ROUTER_SYSTEM_PROMPT},
                {"role": "user", "content": query}
            ],
            temperature=0.0,
            max_tokens=60,
            response_format=RouterResponse,
        )
        parsed = response.choices[0].message.parsed
        return {
            'intent': parsed.intent,
            'confidence': float(parsed.confidence)
        }

    except Exception as e:
        logger.warning("Router classification failed (%s) — using safe fallback.", e)
        return {'intent': 'regulatory', 'confidence': 0.5}
