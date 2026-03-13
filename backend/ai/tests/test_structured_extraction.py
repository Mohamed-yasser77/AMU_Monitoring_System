
import os
import django
import sys
import json

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from ai.llm.generator import generate_structured_response

def test_structured_extraction():
    print("Testing Structured Extraction...")
    
    mock_chunks = [
        {
            "text": "The withdrawal period for Colistin sulfate in Bovine is 7 days in water.",
            "source_label": "Source Doc p.1",
            "metadata": {"chunk_id": "123"}
        }
    ]
    query = "withdrawal period for Colistin in Bovine"
    
    # Test case: Valid extraction
    print("\n[Test 1] Valid Context")
    res1 = generate_structured_response(query, mock_chunks, 0.95)
    print(json.dumps(res1, indent=2))
    
    # Test case: No data in context
    print("\n[Test 2] Missing Data")
    mock_chunks_empty = [{"text": "Pesticides are used in farming.", "source_label": "Misc p.1", "metadata": {}}]
    res2 = generate_structured_response(query, mock_chunks_empty, 0.95)
    print(json.dumps(res2, indent=2))

if __name__ == "__main__":
    test_structured_extraction()
