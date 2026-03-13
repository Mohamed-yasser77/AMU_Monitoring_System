"""
LLM Query Router
Classifies user intent before retrieval to prevent chunk mixing.
Uses Gemini 2.0 Flash — free tier, fast, consistent JSON output.
"""

import json
import logging
from google import genai
from google.genai import types
from django.conf import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    """Lazy-loaded Gemini client singleton."""
    global _client
    if _client is None:
        api_key = settings.GEMINI_API_KEY
        if not api_key:
            logger.error("GEMINI_API_KEY not configured.")
            return None
        _client = genai.Client(api_key=api_key)
    return _client


ROUTER_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "intent": {
            "type": "string",
            "enum": ["regulatory", "pharmacokinetic", "out_of_scope"]
        },
        "confidence": {"type": "number"}
    },
    "required": ["intent", "confidence"]
}

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
    Classifies query intent using Gemini 2.0 Flash with strict JSON output.
    """
    client = _get_client()
    if not client:
        return {'intent': 'regulatory', 'confidence': 0.5}

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=query,
            config=types.GenerateContentConfig(
                system_instruction=ROUTER_SYSTEM_PROMPT,
                temperature=0.0,
                max_output_tokens=60,
                response_mime_type="application/json",
                response_schema=ROUTER_RESPONSE_SCHEMA,
            ),
        )
        parsed = json.loads(response.text)
        return {
            'intent': parsed.get('intent', 'regulatory'),
            'confidence': float(parsed.get('confidence', 0.5))
        }

    except Exception as e:
        logger.warning("Router classification failed (%s) — using safe fallback.", e)
        return {'intent': 'regulatory', 'confidence': 0.5}
