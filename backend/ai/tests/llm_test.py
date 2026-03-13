"""
Full LLM Pipeline Test — Week 3
Tests: OpenRouter API connection → Intent Router → Retrieval → Grounded Generator

Run from backend/:
    python ai/tests/llm_test.py

Does NOT require a running Django server or JWT token.
Tests the module stack directly.
"""

import sys, os
import time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Bootstrap Django settings so OPENROUTER_API_KEY is loaded from .env
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
import django
django.setup()

from openai import OpenAI
from django.conf import settings
from ai.retrieval.retriever import retrieve, lookup_withdrawal_period
from ai.llm.router import classify_query
from ai.llm.generator import generate_response

SEPARATOR = "-" * 60

def header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def sub(title):
    print(f"\n  {SEPARATOR}")
    print(f"  {title}")
    print(f"  {SEPARATOR}")

# ── Preflight: Verify API key is loaded ──────────────────────
header("PREFLIGHT CHECKS")

api_key = settings.OPENAI_API_KEY
if not api_key:
    print("  FAIL: OPENAI_API_KEY not found in settings.")
    print("  Make sure backend/.env has OPENAI_API_KEY set.")
    sys.exit(1)

masked = api_key[:12] + "..." + api_key[-4:]
print(f"  API Key loaded : {masked}")
print(f"  Model          : gpt-4o-mini")
print("  PASS\n")


# ── TEST 1: Intent Router ────────────────────────────────────
header("TEST 1: Intent Router (classify_query)")

router_cases = [
    ("What is the MRL for colistin in poultry?",                "regulatory"),
    ("What is the withdrawal period for amoxicillin in cattle?","pharmacokinetic"),
    ("How do I bake a chocolate cake?",                         "out_of_scope"),
    ("Can fluoroquinolones be used prophylactically in poultry?","regulatory"),
    ("What is the half-life of oxytetracycline in pigs?",       "pharmacokinetic"),
]

router_passed = 0
for query, expected_intent in router_cases:
    result = classify_query(query)
    # No delay needed for paid OpenAI

    intent = result.get("intent")
    confidence = result.get("confidence", 0)
    match = "PASS" if intent == expected_intent else "FAIL"
    if match == "PASS":
        router_passed += 1
    print(f"  [{match}] Q: \"{query[:55]}...\"")
    print(f"         Expected: {expected_intent} | Got: {intent} (conf={confidence:.2f})\n")

print(f"  Router score: {router_passed}/{len(router_cases)}")


# ── TEST 2: Full Regulatory Pipeline ────────────────────────
header("TEST 2: Full Regulatory Pipeline (retrieve + generate)")

reg_queries = [
    {
        "query": "What is the MRL limit for colistin in poultry eggs?",
        "species": "AVI",
        "expect_source_contains": "Colistin",
    },
    {
        "query": "How does the WHO AGISAR categorize antimicrobials by importance?",
        "species": None,
        "expect_source_contains": "WHO",
    },
    {
        "query": "What are the guidelines for prudent use of antimicrobials on farms?",
        "species": None,
        "expect_source_contains": None,  # any source is fine
    },
]

reg_passed = 0
for case in reg_queries:
    sub(f"Query: {case['query']}")

    retrieval = retrieve(
        query=case["query"],
        species_filter=case["species"],
        source_type_filter="regulatory",
        top_k=5
    )

    print(f"  Chunks retrieved : {len(retrieval['chunks'])}")
    print(f"  Max similarity   : {retrieval['max_similarity']:.4f}")
    print(f"  Flagged          : {retrieval['flagged']}")
    if retrieval["chunks"]:
        for i, c in enumerate(retrieval["chunks"][:3], 1):
            print(f"  [{i}] {c['source_label']}  sim={c['similarity']:.4f}")

    result = generate_response(
        query=case["query"],
        chunks=retrieval["chunks"],
        max_similarity=retrieval["max_similarity"],
    )
    # No delay needed for paid OpenAI


    print(f"\n  Confidence       : {result['confidence']:.4f}")
    print(f"  Grounding passed : {result['grounding_passed']}")
    print(f"  Flagged for vet  : {result['flagged_for_review']}")
    print(f"  Source           : {result['source']}")
    print(f"\n  Answer (first 300 chars):")
    print(f"  {result['answer'][:300]}")

    # Pass conditions
    answer_ok = len(result["answer"]) > 20
    not_empty = result["source"] is not None or result["flagged_for_review"]
    source_ok = True
    if case["expect_source_contains"] and result["source"]:
        source_ok = case["expect_source_contains"].lower() in result["source"].lower()

    if answer_ok and not_empty and source_ok:
        print(f"\n  PASS")
        reg_passed += 1
    else:
        print(f"\n  FAIL — answer_ok={answer_ok}, source_ok={source_ok}")

print(f"\n  Regulatory pipeline score: {reg_passed}/{len(reg_queries)}")


# ── TEST 3: Harvest Forecast (CSV path) ─────────────────────
header("TEST 3: Harvest Forecast — CSV Direct Path")

from datetime import date, timedelta

harvest_cases = [
    {"molecule": "Colistin sulfate", "species": "AVI", "treatment_date": date(2026, 3, 2), "expected_days": 1},
    {"molecule": "Colistin sulfate", "species": "BOV", "treatment_date": date(2026, 3, 2), "expected_days": 7},
    {"molecule": "Colistin sulfate", "species": "SUI", "treatment_date": date(2026, 3, 2), "expected_days": 1},
]

harvest_passed = 0
for case in harvest_cases:
    row = lookup_withdrawal_period(case["molecule"], case["species"])
    if row:
        days = int(row["withdrawal_period_days"])
        safe_date = case["treatment_date"] + timedelta(days=days)
        match = days == case["expected_days"]
        verdict = "PASS" if match else "FAIL"
        if match:
            harvest_passed += 1
        print(f"  [{verdict}] {case['molecule']} / {case['species']}")
        print(f"         withdrawal={days}d | safe_harvest={safe_date} | expected_days={case['expected_days']}\n")
    else:
        print(f"  [FAIL] {case['molecule']} / {case['species']} — not found in CSV\n")

print(f"  Harvest forecast score: {harvest_passed}/{len(harvest_cases)}")


# ── TEST 4: Grounding Engine ─────────────────────────────────
header("TEST 4: Grounding Engine — Hallucination Check")

# Simulate a response with a number NOT in the source chunks
from ai.llm.generator import _grounding_check

fake_chunks = [{"text": "The withdrawal period for Colistin in poultry is 1 day for meat products."}]
good_response = "The withdrawal period is 1 day for meat products."
bad_response  = "The withdrawal period is 14 days for meat products."  # 14 is not in source

passed_good, _ = _grounding_check(good_response, fake_chunks)
passed_bad,  ungrounded = _grounding_check(bad_response, fake_chunks)

print(f"  Grounded response (1 day)   : grounding_passed={passed_good}  (expected True)  {'PASS' if passed_good else 'FAIL'}")
print(f"  Hallucinated response (14d) : grounding_passed={passed_bad}  (expected False) {'PASS' if not passed_bad else 'FAIL'}")
print(f"  Ungrounded numbers detected : {ungrounded}")

grounding_ok = passed_good and not passed_bad


# ── OVERALL SUMMARY ──────────────────────────────────────────
header("OVERALL SUMMARY")

total_passed = router_passed + reg_passed + harvest_passed + (2 if grounding_ok else 0)
total_tests  = len(router_cases) + len(reg_queries) + len(harvest_cases) + 2

print(f"  Intent Router    : {router_passed}/{len(router_cases)}")
print(f"  Regulatory RAG   : {reg_passed}/{len(reg_queries)}")
print(f"  Harvest Forecast : {harvest_passed}/{len(harvest_cases)}")
print(f"  Grounding Engine : {'2/2' if grounding_ok else '0/2'}")
print(f"\n  TOTAL : {total_passed}/{total_tests}")
print(f"\n{'='*60}\n")
