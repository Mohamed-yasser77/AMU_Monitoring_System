
import os
import sys
import json

# Ensure backend/ is in the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
import django
django.setup()

from ai.llm.generator import generate_response
from ai.retrieval.retriever import retrieve

def test_cross_species_grounding():
    print("\n--- Stress Test: Cross-Species Grounding ---")
    
    # query about Bovine
    query = "What is the recommended dosage for Colistin in Bovine adults?"
    
    # We purposefully mock or find chunks that are NOT about Bovine
    # Let's use real retrieval first to see what we get
    retrieval = retrieve(query, species_filter='BOV', source_type_filter='regulatory', top_k=3)
    
    print(f"Retrieved {len(retrieval['chunks'])} chunks.")
    for i, c in enumerate(retrieval['chunks']):
        print(f"Chunk {i} Source: {c['source_label']} (Sim: {c['similarity']})")
        # print(f"Text Snippet: {c['text'][:100]}...")

    result = generate_response(query, retrieval['chunks'], retrieval['max_similarity'])
    
    print("\nAI RESPONSE:")
    print(f"Answer: {result['answer']}")
    print(f"Flagged for Review: {result['flagged_for_review']}")
    print(f"Grounding Passed: {result['grounding_passed']}")
    print(f"Ungrounded Items: {result['ungrounded_items']}")
    print(f"Supporting Quotes: {result['quotes']}")

    # Verification: If the AI made a claim about Bovine using Poultry data, 
    # and we forced exact quotes, the quote check should catch it if the AI 
    # tried to "rewrite" the quote to mention Bovine.
    # If the AI provided a Poultry quote but said it applies to Bovine in the answer, 
    # we might need a semantic check, but at least we have the quotes for the human to see.

def test_hallucinated_number():
    print("\n--- Stress Test: Hallucinated Number ---")
    query = "What is the MRL for Colistin?"
    # Mocking a chunk with a specific number
    chunks = [{
        'text': "The MRL for Colistin in poultry kidney is 200 ug/kg.",
        'metadata': {'source': 'Test_Doc', 'page': 1},
        'source_label': 'Test_Doc p.1'
    }]
    
    # We call generate_response but we can't easily force the LLM to hallucinate a number 
    # unless we use a very specific prompt. 
    # Instead, we test the _grounding_check directly.
    from ai.llm.generator import _grounding_check
    
    passed, items = _grounding_check("The MRL is 300 ug/kg.", chunks)
    # The regex should find '200' but NOT '300'.
    print(f"Hallucinated 300: Passed={passed}, Items={items}")
    
    # Test case 2: AI provides a quote that doesn't exist
    passed, items = _grounding_check("The MRL is 200.", chunks, quotes=["The limit is 500."])
    print(f"Hallucinated Quote: Passed={passed}, Items={items}")

if __name__ == '__main__':
    # Set environment variables for Gemini if needed (should already be set)
    test_hallucinated_number()
    test_cross_species_grounding()
