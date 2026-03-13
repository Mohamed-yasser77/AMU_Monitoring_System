"""
PDF Ingestion Pipeline — Week 1
Extracts text from PDFs, chunks by section, embeds with MiniLM, loads into ChromaDB.

Usage:
    cd backend/
    python ai/ingest/run_ingest.py
"""

import os
import sys
import hashlib
import re
import fitz  # PyMuPDF
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF_DIR = os.path.join(BASE_DIR, '..', 'Documentation and data')
VECTORSTORE_DIR = os.path.join(BASE_DIR, 'ai', 'vectorstore_v3')
COLLECTION_NAME = 'regulatory_docs_v3'
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'
MIN_CHUNK_CHARS = 200   # discard tiny fragments
MAX_CHUNK_CHARS = 1500  # split oversized sections

# Map filename → metadata defaults
PDF_METADATA = {
    '9789241515528-eng.pdf': {
        'source': 'WHO_AGISAR_2019',
        'jurisdiction': 'global',
        'source_type': 'regulatory',
    },
    'Guidelines on monitoring antimicrobial use at the farm level.pdf': {
        'source': 'FAO_AMU_Farm_Guidelines',
        'jurisdiction': 'global',
        'source_type': 'regulatory',
    },
    'oie-list-antimicrobials.pdf': {
        'source': 'OIE_Antimicrobial_List',
        'jurisdiction': 'global',
        'source_type': 'regulatory',
    },
    'Compendium_Contaminants_Regulations_28_01_2022.pdf': {
        'source': 'FSSAI_Contaminant_Compendium_2022',
        'jurisdiction': 'India',
        'source_type': 'regulatory',
    },
    'colistin-article-35-referral-annexes-i-ii-iii_en.pdf': {
        'source': 'EMA_Colistin_Annexes',
        'jurisdiction': 'EU',
        'source_type': 'pharmacokinetic',
    },
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_text_by_page(pdf_path: str) -> list[dict]:
    """Returns list of {page: int, text: str} for each page."""
    doc = fitz.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        if text:
            pages.append({'page': page_num, 'text': text})
    doc.close()
    return pages


def semantic_chunk(pages: list[dict], min_chars: int = MIN_CHUNK_CHARS, max_chars: int = MAX_CHUNK_CHARS) -> list[dict]:
    """
    Chunk text by section boundaries (header-like lines in regulatory PDFs).
    Falls back to paragraph-level splitting when no headers are detected.
    Returns list of {text, page, chunk_index}.
    """
    # Regex: lines that look like section headers (short, possibly numbered)
    HEADER_RE = re.compile(
        r'^(\d+[\.\d]*\s+[A-Z].{3,60}|[A-Z][A-Z\s]{5,50}|Chapter\s+\d+|Section\s+\d+)',
        re.MULTILINE
    )

    chunks = []
    chunk_index = 0
    current_text = ''
    current_page = 1

    for page_data in pages:
        page_num = page_data['page']
        page_text = page_data['text']

        # Split page text on header boundaries
        parts = HEADER_RE.split(page_text)
        for part in parts:
            part = part.strip()
            if not part:
                continue

            current_text += ' ' + part

            # If chunk is large enough to be meaningful and we hit a boundary, save it
            if len(current_text) >= min_chars:
                # Split oversized chunks on paragraph breaks
                if len(current_text) > max_chars:
                    paragraphs = current_text.split('\n\n')
                    sub_buf = ''
                    for para in paragraphs:
                        if len(sub_buf) + len(para) > max_chars and len(sub_buf) >= min_chars:
                            chunks.append({
                                'text': sub_buf.strip(),
                                'page': current_page,
                                'chunk_index': chunk_index
                            })
                            chunk_index += 1
                            sub_buf = para
                        else:
                            sub_buf += '\n\n' + para
                    if len(sub_buf.strip()) >= min_chars:
                        chunks.append({
                            'text': sub_buf.strip(),
                            'page': current_page,
                            'chunk_index': chunk_index
                        })
                        chunk_index += 1
                else:
                    chunks.append({
                        'text': current_text.strip(),
                        'page': current_page,
                        'chunk_index': chunk_index
                    })
                    chunk_index += 1

                current_text = ''
                current_page = page_num

        current_page = page_num

    # Flush remainder
    if current_text.strip() and len(current_text.strip()) >= min_chars:
        chunks.append({
            'text': current_text.strip(),
            'page': current_page,
            'chunk_index': chunk_index
        })

    return chunks


def extract_molecules(text: str) -> str:
    """
    Simple heuristic: look for known molecule names in chunk text.
    Returns comma-separated matches for metadata filtering.
    """
    KNOWN_MOLECULES = [
        'colistin', 'oxytetracycline', 'tetracycline', 'amoxicillin',
        'ampicillin', 'enrofloxacin', 'ciprofloxacin', 'tylosin',
        'lincomycin', 'streptomycin', 'neomycin', 'chloramphenicol',
        'florfenicol', 'tilmicosin', 'erythromycin', 'doxycycline',
        'sulfamethoxazole', 'trimethoprim', 'ceftiofur', 'penicillin',
    ]
    text_lower = text.lower()
    found = [m for m in KNOWN_MOLECULES if m in text_lower]
    return ','.join(found) if found else ''


def make_chunk_id(source: str, chunk_index: int) -> str:
    raw = f"{source}_{chunk_index}"
    return hashlib.md5(raw.encode()).hexdigest()


# ── Main pipeline ─────────────────────────────────────────────────────────────

def run_ingest(pdf_dir: str = PDF_DIR):
    print(f"\n{'='*60}")
    print("AMU RAG — Ingest Pipeline")
    print(f"{'='*60}\n")

    # Load embedding model
    print(f"Loading embedding model: {EMBEDDING_MODEL}...")
    embedder = SentenceTransformer(EMBEDDING_MODEL)
    print("Model loaded.\n")

    # Connect to ChromaDB
    os.makedirs(VECTORSTORE_DIR, exist_ok=True)
    client = chromadb.PersistentClient(path=VECTORSTORE_DIR)

    # Get or create collection
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}  # cosine similarity for threshold comparison
    )

    existing_count = collection.count()
    print(f"ChromaDB collection '{COLLECTION_NAME}': {existing_count} existing chunks.\n")

    total_ingested = 0
    total_skipped = 0

    for filename, meta_defaults in PDF_METADATA.items():
        pdf_path = os.path.join(pdf_dir, filename)
        if not os.path.exists(pdf_path):
            print(f"  [WARN] Not found, skipping: {filename}")
            continue

        print(f"Processing: {filename}")
        pages = extract_text_by_page(pdf_path)
        chunks = semantic_chunk(pages)
        print(f"  → {len(pages)} pages → {len(chunks)} chunks")

        docs_to_add = []
        ids_to_add = []
        embeddings_to_add = []
        metadatas_to_add = []

        for chunk in chunks:
            chunk_id = make_chunk_id(meta_defaults['source'], chunk['chunk_index'])

            # Skip if already in collection (idempotent)
            existing = collection.get(ids=[chunk_id])
            if existing['ids']:
                total_skipped += 1
                continue

            molecules = extract_molecules(chunk['text'])
            metadata = {
                **meta_defaults,
                'page': chunk['page'],
                'chunk_index': chunk['chunk_index'],
                'molecule': molecules,
                'chunk_id': chunk_id,
            }

            embedding = embedder.encode(chunk['text']).tolist()

            docs_to_add.append(chunk['text'])
            ids_to_add.append(chunk_id)
            embeddings_to_add.append(embedding)
            metadatas_to_add.append(metadata)

        if docs_to_add:
            # Batch insert (ChromaDB recommends ≤ 500 per call)
            batch_size = 100
            for i in range(0, len(docs_to_add), batch_size):
                collection.add(
                    documents=docs_to_add[i:i+batch_size],
                    embeddings=embeddings_to_add[i:i+batch_size],
                    ids=ids_to_add[i:i+batch_size],
                    metadatas=metadatas_to_add[i:i+batch_size],
                )
            print(f"  ✓ Ingested {len(docs_to_add)} new chunks")
            total_ingested += len(docs_to_add)
        else:
            print(f"  ✓ All chunks already indexed (skipped {total_skipped})")

    print(f"\n{'='*60}")
    print(f"Ingest complete: {total_ingested} new chunks added.")
    print(f"Total in collection: {collection.count()} chunks.")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    run_ingest()
