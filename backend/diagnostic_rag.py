import os
import chromadb
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTORSTORE_DIR = os.path.join(BASE_DIR, 'ai', 'vectorstore_v3')
COLLECTION_NAME = 'regulatory_docs_v3'

def diagnostic():
    if not os.path.exists(VECTORSTORE_DIR):
        print(f"Directory not found: {VECTORSTORE_DIR}")
        return

    client = chromadb.PersistentClient(path=VECTORSTORE_DIR)
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        count = collection.count()
        print(f"Collection '{COLLECTION_NAME}' has {count} documents.")
        
        if count > 0:
            # Check a few sample metadatas to see the structure
            samples = collection.peek(limit=5)
            print("\nSample Metadatas:")
            for meta in samples['metadatas']:
                print(meta)
                
            # Search for Amoxicillin specifically
            print("\nSearching for 'Amoxicillin'...")
            embedder = SentenceTransformer('all-MiniLM-L6-v2')
            query_embedding = embedder.encode("Amoxicillin").tolist()
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=3,
                include=['documents', 'metadatas', 'distances']
            )
            print("Search Results:")
            for i, (doc, meta, dist) in enumerate(zip(results['documents'][0], results['metadatas'][0], results['distances'][0])):
                print(f"Result {i+1} (Dist: {dist}): {doc[:100]}...")
                print(f"Metadata: {meta}")
        
    except Exception as e:
        print(f"Error accessing collection: {e}")

if __name__ == "__main__":
    diagnostic()
