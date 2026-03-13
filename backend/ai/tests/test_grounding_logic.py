
import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from ai.llm.generator import _grounding_check

def test_grounding():
    print("Testing Grounding Logic...")
    
    # Test case 1: Naive match should fail (28 should not match 128)
    res1, ungrounded1 = _grounding_check("28", [{"text": "Dosage is 128mg", "metadata": {}}])
    print(f"Test 1 (28 vs 128): {'PASS' if not res1 else 'FAIL'} | Ungrounded: {ungrounded1}")
    
    # Test case 2: Valid match
    res2, ungrounded2 = _grounding_check("28", [{"text": "Dosage is 28mg", "metadata": {}}])
    print(f"Test 2 (28 vs 28): {'PASS' if res2 else 'FAIL'} | Ungrounded: {ungrounded2}")
    
    # Test case 3: Decimal match
    res3, ungrounded3 = _grounding_check("0.15", [{"text": "MRL is 0.15 mg/kg", "metadata": {}}])
    print(f"Test 3 (0.15 vs 0.15): {'PASS' if res3 else 'FAIL'} | Ungrounded: {ungrounded3}")

if __name__ == "__main__":
    test_grounding()
