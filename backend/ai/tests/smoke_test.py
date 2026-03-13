"""
Quick smoke test for the retrieval pipeline.
Run from backend/: python ai/tests/smoke_test.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai.retrieval.retriever import retrieve, lookup_withdrawal_period, lookup_mrl

print("=" * 55)
print("AMU RAG — Smoke Test")
print("=" * 55)

# Test 1: Vector retrieval
print("\n[1] Vector Retrieval — Colistin withdrawal, AVI")
result = retrieve("What is the withdrawal period for Colistin in poultry?", species_filter="AVI", top_k=3)
print(f"    Max similarity : {result['max_similarity']}")
print(f"    Flagged        : {result['flagged']}")
print(f"    Chunks returned: {len(result['chunks'])}")
for i, c in enumerate(result["chunks"]):
    print(f"    [{i+1}] {c['source_label']}  sim={c['similarity']}")
assert len(result["chunks"]) > 0, "FAIL: No chunks returned"
assert result["max_similarity"] > 0, "FAIL: Zero similarity"
print("    PASS")

# Test 2: CSV withdrawal lookup
print("\n[2] CSV Withdrawal Lookup — Colistin sulfate / AVI")
row = lookup_withdrawal_period("Colistin sulfate", "AVI")
print(f"    Row: {row}")
assert row is not None, "FAIL: No CSV row found"
assert int(row["withdrawal_period_days"]) >= 0, "FAIL: Invalid withdrawal days"
print(f"    Withdrawal days: {row['withdrawal_period_days']}  PASS")

# Test 3: MRL CSV lookup
print("\n[3] MRL CSV Lookup — Colistin / AVI")
mrls = lookup_mrl("Colistin", "AVI")
print(f"    Rows found: {len(mrls)}")
assert len(mrls) > 0, "FAIL: No MRL rows found"
for m in mrls:
    print(f"    {m['tissue']}: {m['mrl_mgkg']} mg/kg")
print("    PASS")

print("\n" + "=" * 55)
print("ALL SMOKE TESTS PASSED")
print("=" * 55)
