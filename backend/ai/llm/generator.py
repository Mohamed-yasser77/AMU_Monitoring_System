"""
LLM Response Generator with Grounding Engine — Week 3
Synthesizes answers strictly from retrieved chunks.
All numeric values are cross-verified against source text (grounding step).
"""

import os
import re
import json
import logging
from google import genai
from google.genai import types
from django.conf import settings
from pydantic import BaseModel
from typing import Optional

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.72

class RegulatoryResponseSchema(BaseModel):
    answer: str
    supporting_quotes: list[str]
    source_documents: list[str]
    confidence_score: float # 0.0 to 1.0 self-assessment

SYNTHESIS_SYSTEM_PROMPT = """You are a helpful and precise regulatory assistant for an antimicrobial usage (AMU) monitoring system. Your goal is to answer veterinary and regulatory queries using the provided context.

RULES:
1. ONLY USE THE PROVIDED CONTEXT. If the answer is not in the context, clearly state what information is missing.
2. EXACT QUOTES: For every claim you make, you MUST provide the exact sentence(s) from the context that supports it. These must be VERBATIM.
3. BE HELPFUL WITH TERMINOLOGY: Explain distinctions (e.g., "very highly important" vs "Highest Priority Critically Important").
4. NO HALLUCINATION: If no relevant information exists, state that clearly in the answer.
5. OUTPUT: Provide structured JSON matching the requested schema.
"""




def _build_context_block(chunks: list[dict]) -> str:
    """Formats retrieved chunks into a numbered context block for the LLM prompt."""
    lines = []
    for i, chunk in enumerate(chunks, start=1):
        src = chunk.get('source_label', 'Unknown')
        lines.append(f"[{i}] SOURCE: {src}\n{chunk['text']}\n")
    return '\n'.join(lines)


def _grounding_check(response_text: str, chunks: list[dict], quotes: list[str] = None) -> bool:
    """
    1. Verifies all numeric values in response_text exist in context.
    2. Verifies all provided quotes exist VERBATIM in context.
    Returns (passed, ungrounded_items)
    """
    all_chunks_text = ' '.join(c['text'] for c in chunks)
    ungrounded = []

    # 1. Numeric Grounding
    numbers_in_response = set(re.findall(r'\b\d+(?:\.\d+)?\b', response_text))
    metadata_values = []
    for c in chunks:
        meta = c.get('metadata', {})
        for val in meta.values():
            if isinstance(val, (int, float)): metadata_values.append(str(val))
            elif isinstance(val, str): metadata_values.extend(re.findall(r'\d+(?:\.\d+)?', val))

    all_numeric_context = all_chunks_text + ' ' + ' '.join(metadata_values)
    
    for num in numbers_in_response:
        pattern = rf'(?<!\d){re.escape(num)}(?!\d)'
        if not re.search(pattern, all_numeric_context):
            ungrounded.append(f"Number: {num}")

    # 2. Quote Grounding (Hard Check)
    if quotes:
        for quote in quotes:
            if quote.strip() and quote.strip() not in all_chunks_text:
                ungrounded.append(f"Quote: {quote[:50]}...")

    return len(ungrounded) == 0, ungrounded


def generate_response(query: str, chunks: list[dict], max_similarity: float) -> dict:
    """
    Generates a grounded LLM response from retrieved chunks.

    Args:
        query: The original user question
        chunks: Retrieved chunks from retriever
        max_similarity: Highest cosine similarity from retrieval

    Returns:
        {
            'answer': str,
            'confidence': float,
            'source': str,
            'flagged_for_review': bool,
            'grounding_passed': bool,
        }
    """
    # Hard threshold: refuse to synthesize if retrieval confidence is too low
    if max_similarity < CONFIDENCE_THRESHOLD or not chunks:
        return {
            'answer': 'I could not find a reliable source for this in the available regulatory documents.',
            'confidence': max_similarity,
            'source': None,
            'flagged_for_review': True,
            'grounding_passed': True,
        }

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        logger.error("GEMINI_API_KEY is not configured in settings.")
        return {
            'answer': 'AI service is not configured. Please contact the administrator.',
            'confidence': 0.0,
            'source': None,
            'flagged_for_review': True,
            'grounding_passed': False,
        }
    client = genai.Client(api_key=api_key)

    context_block = _build_context_block(chunks)

    user_message = f"""CONTEXT:
{context_block}

QUESTION: {query}"""

    if settings.DEBUG:
        with open('last_llm_prompt.txt', 'w', encoding='utf-8') as f:
            f.write(f"SYSTEM PROMPT:\n{SYNTHESIS_SYSTEM_PROMPT}\n\n")
            f.write(f"USER MESSAGE:\n{user_message}\n")

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=SYNTHESIS_SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=1024,
                response_mime_type="application/json",
                response_schema=RegulatoryResponseSchema,
            ),
        )
        data = json.loads(response.text)
        answer_text = data.get('answer', '').strip()
        quotes = data.get('supporting_quotes', [])

        # Hard Grounding: Verify quotes and numbers
        grounding_passed, ungrounded_items = _grounding_check(answer_text, chunks, quotes)
        
        # Self-assessment check: if AI says confidence is low, flag it
        ai_confidence = data.get('confidence_score', 1.0)
        flagged = not grounding_passed or max_similarity < CONFIDENCE_THRESHOLD or ai_confidence < 0.7

        return {
            'answer': answer_text,
            'confidence': round(max_similarity, 4),
            'source': ', '.join(data.get('source_documents', ['Unknown'])),
            'flagged_for_review': flagged,
            'grounding_passed': grounding_passed,
            'ungrounded_items': ungrounded_items,
            'quotes': quotes
        }

    except Exception as e:
        logger.exception("Gemini API call failed: %s", e)
        return {
            'answer': f'An error occurred while generating the response: {e}',
            'confidence': 0.0,
            'source': 'Error',
            'flagged_for_review': True,
            'grounding_passed': False,
            'ungrounded_items': [f"Exception: {str(e)}"],
            'quotes': [],
            'error': str(e),
        }





