import os
import chromadb
from sentence_transformers import SentenceTransformer

# Paths matching retriever.py logic
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VECTORSTORE_DIR = os.path.join(BASE_DIR, 'ai', 'vectorstore_v3')
COLLECTION_NAME = 'regulatory_docs_v3'

def diagnostic():
    print(f"Checking Vectorstore at: {VECTORSTORE_DIR}")
    if not os.path.exists(VECTORSTORE_DIR):
        print(f"Directory not found!")
        return

    client = chromadb.PersistentClient(path=VECTORSTORE_DIR)
    try:
        collection = client.get_collection(name=COLLECTION_NAME)
        count = collection.count()
        print(f"Collection count: {count}")
        
        if count == 0:
            print("WARNING: Collection is empty. Ingestion might not have been run.")
            return

        # 1. Total documents with 'regulatory' source_type
        reg_count = len(collection.get(where={"source_type": "regulatory"})['ids'])
        print(f"Documents with source_type='regulatory': {reg_count}")

        # 2. Check for 'amoxicillin' verbatim in any document
        all_docs = collection.get()['documents']
        amox_count = sum(1 for d in all_docs if 'amoxicillin' in d.lower())
        print(f"Documents containing 'amoxicillin': {amox_count}")

        # 3. Test the specific where_clause logic
        # If species_filter='AVI' and source_type_filter='regulatory'
        test_where = {
            "$or": [
                {"species": {"$eq": "AVI"}},
                {"source_type": {"$eq": "regulatory"}}
            ]
        }
        try:
            results = collection.get(where=test_where)
            print(f"Documents matching where_clause: {len(results['ids'])}")
        except Exception as e:
            print(f"Error testing where_clause: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    diagnostic()
