import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amu_monitoring.settings')
django.setup()

from ai.llm.router import classify_query
from ai.retrieval.retriever import retrieve

query = "what are the very highly important drugs"
print(f"Testing query: {query}")

# Test Router
routing_result = classify_query(query)
print(f"\n[Routing Result]:")
print(routing_result)

# Test Retrieval
retrieval_result = retrieve(query)
print(f"\n[Retrieval Result]:")
print(f"Max Similarity: {retrieval_result['max_similarity']}")
print(f"Flagged: {retrieval_result['flagged']}")
print(f"Chunks: {len(retrieval_result['chunks'])}")
for i, chunk in enumerate(retrieval_result['chunks']):
    print(f"[{i}] {chunk['source_label']} (sim={chunk['similarity']})")
    print(f"Text: {chunk['text'][:100]}...")
