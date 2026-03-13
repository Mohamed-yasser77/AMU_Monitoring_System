# AI Build Plan: Regulatory Assistant + Harvest Forecaster

**Scope**: Phase 1 only (Features 1 & 2). No OCR. No Anomaly Watchdog.
**Estimated Build Time**: 5–6 weeks working consistently.

---

## Architecture Overview

```
User Question
      │
      ▼
[Agentic Router] ──► Classifies intent (Regulatory? Pharmacokinetic?)
      │
      ▼
[Metadata Filter] ──► Narrows retrieval by species, molecule, jurisdiction
      │
      ▼
[ChromaDB Vector Store] ──► Returns top-k relevant chunks with source citation
      │
      ▼
[Grounding Engine] ──► Verifies all numbers against source text (NEVER let LLM guess)
      │
      ▼
[Response] ──► Includes: Answer + Confidence Score + Source PDF + Page Number
```

---

## Non-Negotiable Rules
- **No hallucinated numbers.** Dosages and MRLs come from the source document only. The LLM identifies and formats; it does not calculate.
- **No uncited answer.** Every response must link to a source PDF and page number.
- **No silent failures.** If confidence is below 0.75, the system must say "I could not find a reliable source" and flag for vet review.
- **All AI calls are logged**: `prompt_id`, `model_version`, `retrieved_chunk_ids`, `response_hash`.

---

## Feature 1: Regulatory Assistant

### Week 1 — Data Pipeline (The Foundation)
**Goal**: Populate ChromaDB with clean, tagged regulatory data.

**Data Sources** (must be confirmed before writing code):
- WHO AGISAR guidelines (PDF)
- OIE Terrestrial Animal Health Code (PDF)
- EMA veterinary MRL tables (structured HTML/CSV preferred over PDF)
- National regulatory tables if applicable

**Tasks**:
- [ ] Download, convert, and extract text from all PDFs
- [ ] Define chunking strategy: **Semantic chunking by section** (not fixed-size; regulatory text has logical boundaries)
- [ ] Tag every chunk: `{ source: "WHO_AGISAR_2019", molecule: "Oxytetracycline", species: "AVI", jurisdiction: "global", page: 42 }`
- [ ] Embed using `text-embedding-3-small` (OpenAI) or `all-MiniLM-L6-v2` (local, free)
- [ ] Load into ChromaDB with metadata filters enabled

### Week 2 — Retrieval Core
**Tasks**:
- [ ] Build the retrieval function: takes a query + species filter, returns top-5 chunks with similarity scores
- [ ] Tune chunk size and top-k (benchmark against 20 known test questions)
- [ ] Define confidence threshold: cosine similarity < 0.72 → trigger fallback response

### Week 3 — Agentic Router + Response Generator
**Tasks**:
- [ ] Build the router: classifies query intent before retrieval (prevents irrelevant chunk mixing)
- [ ] Build the response generator: LLM synthesizes the retrieved chunks into a structured answer
- [ ] Implement the Grounding Engine: regex-extract all numbers from the LLM answer, cross-check each against the source chunk

### Week 4 — Backend API Endpoint + Benchmarking
**Backend endpoint**:
```
POST /api/ai/regulatory-query/
Auth: Required (JWT)
Payload: { "query": "string", "species": "AVI | BOV | OVI" }
Response: { "answer": "string", "confidence": 0.0-1.0, "source": "WHO_AGISAR_2019 p.42", "flagged_for_review": bool }
```
**Tasks**:
- [ ] Build and register the Django view for the endpoint
- [ ] Write 100 test questions with verified answers for benchmarking
- [ ] Target: >85% accuracy on regulatory lookup questions
- [ ] Log all queries to a `AIQueryLog` table in the DB

---

## Feature 2: Hybrid Harvest Forecaster

**Timeline**: 1–2 weeks (piggybacks on Feature 1's vector store)

**Core Rule**: RAG retrieves pharmacokinetic (PK) constants. Python executes the math. LLM is not involved in the calculation.

### The Formula
```
Safe Harvest Date = Treatment Date + (Half-life × 7) + Buffer Days
```
- `Half-life` and `Buffer Days` come from the vector store (PK/PD literature chunk)
- Math runs in a sandboxed Python function

**Backend endpoint**:
```
POST /api/ai/harvest-forecast/
Auth: Required (JWT)
Payload: { "molecule": "string", "species": "string", "treatment_date": "YYYY-MM-DD", "dosage": float }
Response: { "safe_harvest_date": "YYYY-MM-DD", "half_life_source": "citation string", "confidence": float }
```

**Tasks**:
- [ ] Ingest PK/PD literature into the same ChromaDB instance (tagged: `source_type: pharmacokinetic`)
- [ ] Build the retrieval function for PK constants
- [ ] Build the sandboxed math function (no LLM)
- [ ] Integrate with existing `Flock.withdrawal_status` logic in `farms/views.py`
- [ ] Write 20 test cases with verified harvest dates

---

## Cost Control (Non-Negotiable)
- Cache all identical queries for 24 hours (same query + species + molecule = same response)
- Rate limit: max 20 AI queries per user per day to prevent runaway API costs
- Use a local embedding model during development; switch to OpenAI only for production

---

## Open Decisions (Must Resolve Before Writing Code)
1. **Embedding model**: OpenAI (paid, higher quality) vs. local `sentence-transformers` (free, slower)?
2. **LLM for routing/synthesis**: GPT-4o-mini (cheap) vs. Gemini Flash (cheap) vs. local Ollama (free, slower)?
3. **Where do RAG endpoints live?** New Django app `ai/` or a separate FastAPI microservice?
4. **Data sources confirmed?** WHO and OIE PDFs must be downloaded and reviewed before Week 1 starts.
