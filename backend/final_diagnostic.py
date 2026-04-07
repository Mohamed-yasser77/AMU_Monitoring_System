import os
import chromadb

# HARDCODED ABSOLUTE PATH - NO MORE GUESSING
VECTORSTORE_DIR = r"d:\PSG TECH 2022-2027\Sem 8\Capstone Project\backend\ai\vectorstore_v3"
COLLECTION_NAME = 'regulatory_docs_v3'

def diagnostic():
    print(f"DIAGNOSTIC START")
    print(f"Targeting: {VECTORSTORE_DIR}")
    
    if not os.path.exists(VECTORSTORE_DIR):
        print(f"❌ FATAL: Directory does not exist on disk.")
        # Let's list the parent to see what IS there
        parent = os.path.dirname(VECTORSTORE_DIR)
        print(f"Contents of {parent}:")
        try:
            print(os.listdir(parent))
        except:
            print("Could not list parent.")
        return

    try:
        client = chromadb.PersistentClient(path=VECTORSTORE_DIR)
        collections = client.list_collections()
        print(f"Available collections: {[c.name for c in collections]}")
        
        collection = client.get_collection(name=COLLECTION_NAME)
        count = collection.count()
        print(f"📊 DOCUMENT COUNT: {count}")
        
        if count > 0:
            print("\n--- METADATA PREVIEW ---")
            peek = collection.peek(limit=3)
            for i, meta in enumerate(peek['metadatas']):
                print(f"Chunk {i}: {meta}")
        else:
            print("❌ ERROR: Collection exists but is EMPTY. Your ingest pipeline failed or was never run.")

    except Exception as e:
        print(f"❌ CRITICAL ERROR: {str(e)}")

if __name__ == "__main__":
    diagnostic()
