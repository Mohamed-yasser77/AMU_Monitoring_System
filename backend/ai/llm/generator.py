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

logger = logging.getLogger(__name__)

CONFIDENCE_THRESHOLD = 0.72

SYNTHESIS_SYSTEM_PROMPT = """You are a helpful and precise regulatory assistant for an antimicrobial usage (AMU) monitoring system. Your goal is to answer veterinary and regulatory queries using the provided context.

RULES:
1. ONLY USE THE PROVIDED CONTEXT. If the answer is not in the context, clearly state what information is missing.
2. BE HELPFUL WITH TERMINOLOGY: If a user's phrasing (e.g., "very highly important") doesn't exactly match the source (e.g., "Highest Priority Critically Important"), use the context to explain the distinction and provide the most relevant information.
3. GROUNDING: Every specific claim or value must be supported by a source chunk.
4. CITATION: Always cite the source (Document and Page) at the end of your answer.
5. NO HALLUCINATION: If no relevant information exists at all, say: "I could not find a reliable source for this in the available regulatory documents."

FORMAT:
<your detailed answer based on context>

Source: <document_name> p.<page_number>
"""

EXTRACTION_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "withdrawal_days": {"type": ["integer", "null"]},
        "source": {"type": "string"},
        "flagged_for_review": {"type": "boolean"},
        "reasoning": {"type": "string"}
    },
    "required": ["withdrawal_days", "source", "flagged_for_review", "reasoning"]
}


DATA_EXTRACTION_SYSTEM_PROMPT = """You are a precise data extraction tool for antimicrobial usage (AMU). Your job is to extract exact numeric withdrawal periods from the provided context.

RULES:
1. EXTRACT ONLY: Find the number of days for the withdrawal period for the specified molecule and species.
2. DIS disclaimer: If the context is ambiguous or contradictory, set "flagged_for_review" to true.
3. OUTPUT: Provide structured JSON matching the requested schema.
"""


def _build_context_block(chunks: list[dict]) -> str:
    """Formats retrieved chunks into a numbered context block for the LLM prompt."""
    lines = []
    for i, chunk in enumerate(chunks, start=1):
        src = chunk.get('source_label', 'Unknown')
        lines.append(f"[{i}] SOURCE: {src}\n{chunk['text']}\n")
    return '\n'.join(lines)


def _grounding_check(response_text: str, chunks: list[dict]) -> bool:
    """
    Extracts all numeric values from the LLM response and verifies
    each exists in at least one source chunk.
    Returns True if all numbers are grounded, False if any number is unsupported.
    """
    # Extract numbers including decimals from the response using word boundaries
    numbers_in_response = set(re.findall(r'\b\d+(?:\.\d+)?\b', response_text))
    
    # Collect all text from chunks
    all_chunks_text = ' '.join(c['text'] for c in chunks)
    
    # Also collect all numeric values from metadata for grounding (e.g., page numbers, dosages)
    metadata_values = []
    for c in chunks:
        meta = c.get('metadata', {})
        for val in meta.values():
            if isinstance(val, (int, float)):
                metadata_values.append(str(val))
            elif isinstance(val, str):
                # Extract numbers from metadata strings too
                metadata_values.extend(re.findall(r'\d+(?:\.\d+)?', val))

    all_allowed_numeric_context = ' '.join(metadata_values)
    
    ungrounded = []
    for num in numbers_in_response:
        # Check if number appears in chunk text or metadata
        # We want to match '28' but NOT inside '128'.
        # A lookbehind/lookahead approach is safer than \b for units like '28mg'
        pattern = rf'(?<!\d){re.escape(num)}(?!\d)'
        if not re.search(pattern, all_chunks_text) and not re.search(pattern, all_allowed_numeric_context):
            ungrounded.append(num)

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
            ),
        )
        answer_text = response.text.strip()

        # Grounding check: verify all numbers in response appear in source chunks
        grounding_passed, ungrounded_nums = _grounding_check(answer_text, chunks)
        flagged = not grounding_passed or max_similarity < CONFIDENCE_THRESHOLD

        # Extract source citation from the best chunk
        best_chunk = chunks[0]
        source_citation = best_chunk.get('source_label', 'Unknown')

        return {
            'answer': answer_text,
            'confidence': round(max_similarity, 4),
            'source': source_citation,
            'flagged_for_review': flagged,
            'grounding_passed': grounding_passed,
            'ungrounded_numbers': ungrounded_nums if not grounding_passed else [],
        }

    except Exception as e:
        logger.exception("Gemini API call failed: %s", e)
        return {
            'answer': f'An error occurred while generating the response: {e}',
            'confidence': 0.0,
            'source': None,
            'flagged_for_review': True,
            'grounding_passed': False,
            'error': str(e),
        }


def generate_structured_response(query: str, chunks: list[dict], max_similarity: float) -> dict:
    """
    Specialized generator for extracting specific data points into JSON.
    Used for Harvest Forecasts to avoid regex hazards.
    """
    if max_similarity < CONFIDENCE_THRESHOLD or not chunks:
        return {
            'withdrawal_days': None,
            'source': None,
            'flagged_for_review': True,
            'reasoning': 'Insufficient retrieval confidence.',
        }

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return {'withdrawal_days': None, 'flagged_for_review': True, 'reasoning': 'API key missing'}

    client = genai.Client(api_key=api_key)
    context_block = _build_context_block(chunks)

    user_message = f"CONTEXT:\n{context_block}\n\nQUERY: {query}"

    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=DATA_EXTRACTION_SYSTEM_PROMPT,
                temperature=0.0,
                max_output_tokens=256,
                response_mime_type="application/json",
                response_schema=EXTRACTION_RESPONSE_SCHEMA,
            ),
        )
        data = json.loads(response.text)
        
        # Grounding check on the reasoning/extracted number
        withdrawal_val = data.get('withdrawal_days')
        if withdrawal_val is not None:
             grounding_passed, _ = _grounding_check(str(withdrawal_val), chunks)
             if not grounding_passed:
                data['flagged_for_review'] = True
                data['reasoning'] = (data.get('reasoning', '') + " [GROUNDING FAILED]").strip()

        return data

    except Exception as e:
        logger.exception("Structured extraction failed: %s", e)
        return {
            'withdrawal_days': None,
            'source': None,
            'flagged_for_review': True,
            'reasoning': f"Error: {e}",
        }


