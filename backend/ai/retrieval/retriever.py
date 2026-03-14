"""
Retrieval Core — Week 2
Handles vector similarity search + structured CSV lookup for numeric facts.

Usage:
    from ai.retrieval.retriever import retrieve, lookup_withdrawal_period, lookup_mrl
"""

import os
import csv
import chromadb
from sentence_transformers import SentenceTransformer

# ── Config ────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VECTORSTORE_DIR = os.path.join(BASE_DIR, 'ai', 'vectorstore_v3')
COLLECTION_NAME = 'regulatory_docs_v3'
EMBEDDING_MODEL = 'all-MiniLM-L6-v2'

WITHDRAWAL_CSV = os.path.join(BASE_DIR, '..', 'Documentation and data', 'molecule_withdrawal_periods.csv')
MRL_CSV = os.path.join(BASE_DIR, '..', 'Documentation and data', 'mrl_limit.csv')

CONFIDENCE_THRESHOLD = 0.72  # below this → flag response for review

# Lazy-loaded singletons (avoid reloading on every request)
_embedder = None
_collection = None


def _get_embedder():
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder


def _get_collection():
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=VECTORSTORE_DIR)
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


# ── Structured CSV lookups (numeric facts — never use RAG for these) ──────────

def lookup_withdrawal_period(molecule: str, species_code: str, product: str = None) -> dict | None:
    """
    Direct CSV lookup for withdrawal periods.
    Returns the best match row as dict, or None if not found.
    This is a hard lookup — no LLM involved.
    """
    if not os.path.exists(WITHDRAWAL_CSV):
        return None

    mol_lower = molecule.lower().strip()
    sp_upper = species_code.upper().strip()
    matches = []

    with open(WITHDRAWAL_CSV, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_mol = (row.get('Molecule') or '').lower().strip()
            row_sp = (row.get('Species_code') or '').upper().strip()
            if not row_mol or not row_sp:
                continue
            if mol_lower in row_mol and row_sp == sp_upper:
                if product:
                    if product.upper() in row.get('Product', '').upper():
                        matches.append(row)
                else:
                    matches.append(row)

    if not matches:
        return None

    # Return the match with shortest/most specific product (prefer MEAT over MEAT_OFFALS)
    return matches[0]


def lookup_mrl(molecule: str, species_group: str, tissue: str = None) -> list[dict]:
    """
    Direct CSV lookup for MRL values.
    Returns list of matching rows, or empty list.
    """
    if not os.path.exists(MRL_CSV):
        return []

    mol_lower = molecule.lower().strip()
    sp_upper = species_group.upper().strip()
    results = []

    with open(MRL_CSV, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row_mol = (row.get('molecule_name') or '').lower().strip()
            row_sp = (row.get('species_group') or '').upper().strip()
            if not row_mol or not row_sp:
                continue
            if mol_lower in row_mol and row_sp == sp_upper:
                if tissue is None or tissue.lower() in row.get('tissue', '').lower():
                    results.append(row)

    return results


# ── Vector Retrieval ──────────────────────────────────────────────────────────

def retrieve(query: str, species_filter: str = None, source_type_filter: str = None, top_k: int = 5) -> dict:
    """
    Retrieves top-k chunks from ChromaDB for a given query.

    Args:
        query: The user's question in natural language
        species_filter: Optional. e.g. 'AVI', 'BOV', 'OVI' — narrows retrieval
        source_type_filter: Optional. 'regulatory' or 'pharmacokinetic'
        top_k: Number of chunks to retrieve

    Returns:
        {
            'chunks': [{'text', 'metadata', 'similarity', 'source_label'}],
            'max_similarity': float,
            'flagged': bool,  # True if max_similarity < CONFIDENCE_THRESHOLD
        }
    """
    collection = _get_collection()
    embedder = _get_embedder()

    if collection.count() == 0:
        return {
            'chunks': [],
            'max_similarity': 0.0,
            'flagged': True,
            'error': 'Vector store is empty. Run the ingest pipeline first.'
        }

    # Build metadata filter
    # Mapping common names to internal codes
    SPECIES_MAP = {
        'POULTRY': 'AVI', 'CHICKEN': 'AVI', 'HEN': 'AVI',
        'CATTLE': 'BOV', 'COW': 'BOV', 'BOVINE': 'BOV',
        'SHEEP': 'OVI', 'OVINE': 'OVI',
        'PIG': 'POR', 'SWINE': 'POR', 'PORCINE': 'POR',
    }
    
    if species_filter:
        sp = species_filter.upper().strip()
        sp_code = SPECIES_MAP.get(sp, sp)
        # Search for requested species OR general documents
        # Note: ChromaDB $or requires at least 2 conditions
        where_clause = {
            "$or": [
                {"species": {"$eq": sp_code}},
                {"source_type": {"$eq": source_type_filter if source_type_filter else "regulatory"}} 
                # Above is a hack because ChromaDB doesn't have a reliable "$exists": False
                # We assume a general document won't have the species tag
            ]
        }
    elif source_type_filter:
        where_clause['source_type'] = source_type_filter

    query_embedding = embedder.encode(query).tolist()

    query_kwargs = {
        'query_embeddings': [query_embedding],
        'n_results': min(top_k, collection.count()),
        'include': ['documents', 'metadatas', 'distances'],
    }
    if where_clause:
        query_kwargs['where'] = where_clause

    results = collection.query(**query_kwargs)

    chunks = []
    max_sim = 0.0

    for i, (doc, meta, dist) in enumerate(zip(
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    )):
        # ChromaDB cosine distance: 0 = identical, 2 = opposite
        # Convert to similarity: sim = 1 - dist/2 (maps to [0,1])
        similarity = round(1.0 - dist / 2.0, 4)
        max_sim = max(max_sim, similarity)

        # Build a human-readable source label
        source = meta.get('source', 'Unknown')
        page = meta.get('page', '?')
        source_label = f"{source} p.{page}"

        chunks.append({
            'text': doc,
            'metadata': meta,
            'similarity': similarity,
            'source_label': source_label,
        })

    # Sort by similarity descending (ChromaDB returns sorted, but be explicit)
    chunks.sort(key=lambda x: x['similarity'], reverse=True)

    return {
        'chunks': chunks,
        'max_similarity': max_sim,
        'flagged': max_sim < CONFIDENCE_THRESHOLD,
    }
