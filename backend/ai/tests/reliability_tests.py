"""
Retrieval Reliability Test Suite
Tests the retrieval pipeline across multiple molecules, query types,
species, and edge cases. Run from backend/:
    python ai/tests/reliability_tests.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai.retrieval.retriever import retrieve, lookup_withdrawal_period, lookup_mrl

CONFIDENCE_THRESHOLD = 0.72

PASS = "\u2705 PASS"
FAIL = "\u274c FAIL"
WARN = "\u26a0\ufe0f  WARN"

results = []

def run_test(name, fn):
    try:
        verdict, detail = fn()
        results.append((name, verdict, detail))
        icon = PASS if verdict == "PASS" else (WARN if verdict == "WARN" else FAIL)
        print(f"  {icon}  {name}")
        print(f"        {detail}")
    except Exception as e:
        results.append((name, "FAIL", str(e)))
        print(f"  {FAIL}  {name}")
        print(f"        EXCEPTION: {e}")


print("\n" + "="*65)
print("AMU RAG \u2014 Retrieval Reliability Test Suite")
print("="*65)


# ═══════════════════════════════════════════════════════════════
# SECTION 1: Vector Retrieval — Different Molecules
# ═══════════════════════════════════════════════════════════════
print("\n\u25b6 SECTION 1: Vector Retrieval — Molecule Variety\n")

def test_oxytetracycline():
    r = retrieve("What are the MRL limits for oxytetracycline in cattle?", species_filter="BOV", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f} | top_src={r['chunks'][0]['source_label'] if r['chunks'] else 'none'}"

def test_amoxicillin():
    r = retrieve("Is amoxicillin critically important for human medicine?", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f} | top_src={r['chunks'][0]['source_label'] if r['chunks'] else 'none'}"

def test_enrofloxacin():
    r = retrieve("What is the WHO classification of enrofloxacin?", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f} | top_src={r['chunks'][0]['source_label'] if r['chunks'] else 'none'}"

def test_colistin_resistance():
    r = retrieve("What are the AMR resistance guidelines for colistin use?", top_k=5)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    chunks_above_thresh = sum(1 for c in r["chunks"] if c["similarity"] >= CONFIDENCE_THRESHOLD)
    return verdict, f"max_sim={sim:.4f} | chunks_above_0.72={chunks_above_thresh}/5"

def test_tetracycline_poultry():
    r = retrieve("Tetracycline use in poultry and withdrawal requirements", species_filter="AVI", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f} | flagged={r['flagged']}"


run_test("Oxytetracycline MRL — BOV", test_oxytetracycline)
run_test("Amoxicillin critically important classification", test_amoxicillin)
run_test("Enrofloxacin WHO classification", test_enrofloxacin)
run_test("Colistin AMR resistance guidelines (top-5)", test_colistin_resistance)
run_test("Tetracycline poultry withdrawal — AVI filter", test_tetracycline_poultry)


# ═══════════════════════════════════════════════════════════════
# SECTION 2: Vector Retrieval — Query Type Variety
# ═══════════════════════════════════════════════════════════════
print("\n\u25b6 SECTION 2: Vector Retrieval — Query Type Variety\n")

def test_regulatory_question():
    r = retrieve("What are the principles of prudent use of antimicrobials in veterinary medicine?", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f}"

def test_pk_question():
    r = retrieve("How is pharmacokinetic data used to determine withdrawal periods?", source_type_filter="pharmacokinetic", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim > 0 else "FAIL"
    return verdict, f"max_sim={sim:.4f} | chunks={len(r['chunks'])}"

def test_farm_monitoring_question():
    r = retrieve("How should antimicrobial usage be monitored at the farm level?", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f} | top_src={r['chunks'][0]['source_label'] if r['chunks'] else 'none'}"

def test_oie_categorisation():
    r = retrieve("OIE list of critically important antimicrobials for veterinary medicine", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f} | top_src={r['chunks'][0]['source_label'] if r['chunks'] else 'none'}"

def test_eu_regulation():
    r = retrieve("EU regulation on maximum residue limits for veterinary drugs in food", top_k=3)
    sim = r["max_similarity"]
    verdict = "PASS" if sim >= CONFIDENCE_THRESHOLD else "WARN"
    return verdict, f"max_sim={sim:.4f}"

run_test("Prudent use principles (regulatory)", test_regulatory_question)
run_test("PK data and withdrawal periods (PK filter)", test_pk_question)
run_test("AMU farm-level monitoring", test_farm_monitoring_question)
run_test("OIE critically important antimicrobials", test_oie_categorisation)
run_test("EU MRL regulation", test_eu_regulation)


# ═══════════════════════════════════════════════════════════════
# SECTION 3: Edge Cases — Out-of-domain and Low Confidence
# ═══════════════════════════════════════════════════════════════
print("\n\u25b6 SECTION 3: Edge Cases — Low Confidence & Out-of-Scope\n")

def test_completely_irrelevant():
    """A nonsense query should return low similarity and be flagged."""
    r = retrieve("What is the capital of France and recipe for croissants?", top_k=3)
    sim = r["max_similarity"]
    is_flagged = r["flagged"]
    # We WANT this to be flagged (low confidence) — that's the correct behaviour
    verdict = "PASS" if is_flagged else "FAIL"
    return verdict, f"max_sim={sim:.4f} | flagged={is_flagged} (should be True for out-of-scope)"

def test_vague_query():
    """A vague query — should still get some results but may be borderline."""
    r = retrieve("drugs animals", top_k=3)
    sim = r["max_similarity"]
    verdict = "WARN" if sim < CONFIDENCE_THRESHOLD else "PASS"
    return verdict, f"max_sim={sim:.4f} | flagged={r['flagged']}"

def test_empty_vectorstore_species():
    """Filter that won't narrow to zero but tests metadata filtering."""
    r = retrieve("antimicrobial resistance monitoring", species_filter="OVI", top_k=3)
    sim = r["max_similarity"]
    # OVI (sheep) barely mentioned in our PDFs — but query should still match
    verdict = "PASS" if len(r["chunks"]) > 0 else "WARN"
    return verdict, f"max_sim={sim:.4f} | chunks={len(r['chunks'])}"

run_test("Completely irrelevant query — must be flagged", test_completely_irrelevant)
run_test("Vague 2-word query", test_vague_query)
run_test("OVI (sheep) species filter — sparse in data", test_empty_vectorstore_species)


# ═══════════════════════════════════════════════════════════════
# SECTION 4: CSV Lookups — All Species in Data
# ═══════════════════════════════════════════════════════════════
print("\n\u25b6 SECTION 4: CSV Lookups — All Species in Data\n")

def test_csv_colistin_bov():
    row = lookup_withdrawal_period("Colistin sulfate", "BOV")
    verdict = "PASS" if row and int(row["withdrawal_period_days"]) >= 0 else "FAIL"
    return verdict, f"withdrawal_days={row['withdrawal_period_days'] if row else 'NOT FOUND'}"

def test_csv_colistin_sui():
    row = lookup_withdrawal_period("Colistin sulfate", "SUI")
    verdict = "PASS" if row and int(row["withdrawal_period_days"]) >= 0 else "FAIL"
    return verdict, f"withdrawal_days={row['withdrawal_period_days'] if row else 'NOT FOUND'}"

def test_csv_unknown_molecule():
    """A molecule not in the CSV should return None — correct fallback behaviour."""
    row = lookup_withdrawal_period("Amoxicillin", "AVI")
    verdict = "PASS" if row is None else "WARN"
    return verdict, f"result={row} (None = correct, triggers RAG fallback)"

def test_mrl_bov_muscle():
    rows = lookup_mrl("Colistin", "BOV", tissue="Muscle")
    verdict = "PASS" if rows and float(rows[0]["mrl_mgkg"]) > 0 else "FAIL"
    return verdict, f"mrl={rows[0]['mrl_mgkg']} mg/kg for BOV Muscle" if rows else "NOT FOUND"

def test_mrl_sui_kidney():
    rows = lookup_mrl("Colistin", "SUI", tissue="Kidney")
    verdict = "PASS" if rows else "FAIL"
    return verdict, f"mrl={rows[0]['mrl_mgkg']} mg/kg for SUI Kidney" if rows else "NOT FOUND"

def test_mrl_case_insensitive():
    """Molecule name matching should be case-insensitive."""
    rows_lower = lookup_mrl("colistin", "AVI")
    rows_upper = lookup_mrl("COLISTIN", "AVI")
    verdict = "PASS" if len(rows_lower) == len(rows_upper) > 0 else "FAIL"
    return verdict, f"lower={len(rows_lower)} rows, upper={len(rows_upper)} rows (must match)"

run_test("Withdrawal period — Colistin / BOV", test_csv_colistin_bov)
run_test("Withdrawal period — Colistin / SUI", test_csv_colistin_sui)
run_test("Unknown molecule → None → RAG fallback trigger", test_csv_unknown_molecule)
run_test("MRL lookup — Colistin BOV Muscle", test_mrl_bov_muscle)
run_test("MRL lookup — Colistin SUI Kidney", test_mrl_sui_kidney)
run_test("MRL lookup — case insensitive matching", test_mrl_case_insensitive)


# ═══════════════════════════════════════════════════════════════
# RESULTS SUMMARY
# ═══════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("RESULTS SUMMARY")
print("="*65)

passed = sum(1 for _, v, _ in results if v == "PASS")
warned = sum(1 for _, v, _ in results if v == "WARN")
failed = sum(1 for _, v, _ in results if v == "FAIL")
total = len(results)

print(f"\n  Total tests  : {total}")
print(f"  {PASS}       : {passed}")
print(f"  {WARN}       : {warned}")
print(f"  {FAIL}       : {failed}")
print(f"\n  Score: {passed}/{total} passed  ({100*passed//total}%)")

if failed > 0:
    print("\n  FAILED TESTS:")
    for name, v, detail in results:
        if v == "FAIL":
            print(f"    - {name}: {detail}")

if warned > 0:
    print("\n  WARNINGS (low similarity — check data coverage):")
    for name, v, detail in results:
        if v == "WARN":
            print(f"    - {name}: {detail}")

print("\n" + "="*65 + "\n")
