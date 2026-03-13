"""
Router Debug Test — isolates which queries fail classification.
Run from backend/:  python ai/tests/debug_router.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
import django
django.setup()

from openai import OpenAI
from django.conf import settings
import json

cases = [
    ("What is the MRL for colistin in poultry?",                "regulatory"),
    ("What is the withdrawal period for amoxicillin in cattle?","pharmacokinetic"),
    ("How do I bake a chocolate cake?",                         "out_of_scope"),
    ("Can fluoroquinolones be used prophylactically in poultry?","regulatory"),
    ("What is the half-life of oxytetracycline in pigs?",       "pharmacokinetic"),
]

SYSTEM = """You are a query classifier for an antimicrobial usage (AMU) monitoring system.
Classify the user query into exactly one of these categories:
- "regulatory": Questions about regulations, guidelines, MRL limits, categorization of antimicrobials, WHO/OIE/EMA rules, prohibited substances, or antimicrobial resistance policy.
- "pharmacokinetic": Questions about withdrawal periods, half-life, dosage, tissue residues, safe harvest dates, or drug clearance in animals.
- "out_of_scope": Any question unrelated to antimicrobial use in livestock, veterinary medicine, or food safety.

Respond ONLY with valid JSON in this exact format (no explanation, no markdown):
{"intent": "regulatory" | "pharmacokinetic" | "out_of_scope", "confidence": 0.0-1.0}
"""

client = OpenAI(api_key=settings.OPENROUTER_API_KEY, base_url=settings.OPENROUTER_BASE_URL)

print(f"Model: {settings.OPENROUTER_MODEL}\n")
passed = 0

for query, expected in cases:
    try:
        response = client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[
                {'role': 'system', 'content': SYSTEM},
                {'role': 'user', 'content': query},
            ],
            temperature=0.0,
            max_tokens=60,
        )
        raw = response.choices[0].message.content.strip()
        print(f"Q: {query}")
        print(f"   Raw response: {raw!r}")

        # Try parsing
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'): raw = raw[4:]
            raw = raw.strip()
        parsed = json.loads(raw)
        intent = parsed.get('intent')
        conf   = parsed.get('confidence', 0)
        match  = "PASS" if intent == expected else "FAIL"
        if match == "PASS":
            passed += 1
        print(f"   Parsed: intent={intent}  conf={conf:.2f}")
        print(f"   Expected: {expected}  [{match}]\n")

    except Exception as e:
        print(f"Q: {query}")
        print(f"   ERROR: {e}\n")

print(f"Score: {passed}/{len(cases)}")
