"""
Standalone Gemini API test — no Django required.
Run: python test_gemini.py
"""

import sys
from google import genai
from google.genai import types

# ── hardcoded for testing ───────────────────────────────────────────────────
API_KEY = "AIzaSyAcysl6zzgCna5s29wLfjGlUYwmuD_xu04"
MODEL   = "gemini-2.5-flash"
# ───────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a helpful regulatory assistant for an antimicrobial usage (AMU) monitoring system. "
    "Answer concisely using only the provided context."
)

MOCK_CHUNKS = [
    {
        "text": (
            "Fluoroquinolones and third- and fourth-generation cephalosporins are classified as "
            "Highest Priority Critically Important Antimicrobials (HPCIA) by the WHO. "
            "Their use in food-producing animals should be restricted to cases where no "
            "other effective treatment is available."
        ),
        "source_label": "WHO_AWaRe_2023, p.12",
    }
]

def build_context(chunks):
    lines = []
    for i, c in enumerate(chunks, 1):
        lines.append(f"[{i}] SOURCE: {c['source_label']}\n{c['text']}\n")
    return "\n".join(lines)

def main():
    print(f"google-genai SDK version check …")
    print(f"  Using model : {MODEL}")
    print(f"  API key     : {API_KEY[:12]}…\n")

    client = genai.Client(api_key=API_KEY)
    context = build_context(MOCK_CHUNKS)
    user_msg = f"CONTEXT:\n{context}\n\nQUESTION: What are HPCIA antimicrobials?"

    print("Sending request to Gemini …\n")
    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=user_msg,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.1,
                max_output_tokens=512,
            ),
        )

        print("=" * 60)
        print("RESPONSE TEXT:")
        print("=" * 60)
        print(response.text)
        print("=" * 60)
        print("\n✅  Gemini integration is working correctly.")

    except Exception as e:
        print(f"\n❌  ERROR — {type(e).__name__}: {e}", file=sys.stderr)
        print("\nFull traceback:")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
