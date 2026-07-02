# Backend — Onco Trial Match API

FastAPI + PostgreSQL + ChromaDB backend for the AI oncology clinical trial
matching & patient eligibility platform.

## Step 1 scope (skeleton)

- FastAPI app boots with a `/health` endpoint
- Async SQLAlchemy engine wired to PostgreSQL
- ChromaDB HTTP client wrapper
- `Trial`, `Patient`, `Match` models defined (tables auto-created on startup
  for dev — swap to Alembic migrations before production)
- Pydantic schemas for all three entities
- Docker Compose wiring for `backend` + `postgres` + `chromadb`

## Step 2 scope (ClinicalTrials.gov ingestion)

- `app/ingestion/clinicaltrials_client.py` — async client for the
  ClinicalTrials.gov API v2 (free, no key required), pages through
  recruiting trials for a given condition
- `app/ingestion/normalizer.py` — flattens the raw nested study JSON into
  the shape our `Trial` model expects
- `app/ingestion/text_chunking.py` — splits eligibility criteria text into
  clean chunks ready for embedding
- `app/ingestion/trials_ingest.py` — ties it together: fetch → normalize →
  upsert into Postgres → parse eligibility → chunk + store in ChromaDB.
  Runnable as a CLI.
- `app/api/trials.py` — read-only endpoints to browse ingested trials
  (`GET /trials`, `GET /trials/{id}`, `GET /trials/by-nct/{nct_id}`)

**Note:** the embeddings stored at this stage are deterministic placeholders
(hash-based), not real BioBERT vectors — see `_placeholder_embed` in
`trials_ingest.py`. This keeps the ingestion → ChromaDB pipeline fully
testable before the ML stack lands in Step 4, where the placeholder gets
swapped for `app.embeddings.biobert_embedder`.

## Step 3 scope (eligibility NLP parser)

- `app/nlp/schema.py` — `ParsedEligibility` / `AgeRange` Pydantic models:
  the structured shape stored in `Trial.eligibility_structured`
- `app/nlp/section_splitter.py` — splits raw criteria text into
  inclusion/exclusion blocks, then into individual criterion lines
  (handles bulleted, numbered, and plain-sentence formats)
- `app/nlp/field_extractors.py` — regex-based extraction of age range,
  oncology biomarkers (EGFR, ALK, PD-L1, BRAF, HER2, BRCA, MSI-H, etc.),
  and prior-treatment mentions from criterion lines
- `app/nlp/llm_fallback.py` — calls the configured LLM (Claude, via
  `ANTHROPIC_API_KEY`) to extract the same fields when rule-based parsing
  comes back sparse, so unusual phrasing isn't silently dropped
- `app/nlp/eligibility_parser.py` — orchestrates the above: rule-based
  pass first, LLM fallback only when needed (keeps cost down across a
  full ingestion batch)

This is now wired into `trials_ingest.py` (Step 2's pipeline) — every
trial ingested gets `eligibility_structured` populated automatically.

**Rule-based vs LLM-assisted:** each `ParsedEligibility` carries a
`parse_method` field (`"rule_based"` or `"llm_assisted"`) so downstream
consumers (the matching layer, Step 4-5) can weight confidence accordingly.

**Cost control:** the LLM fallback only fires when rule-based extraction
finds *nothing* for age/biomarkers/prior-treatment — most trials with
standard phrasing never need it. Use `--no-llm-fallback` on the ingestion
CLI to disable it entirely (e.g. while testing without an API key).

BioBERT embeddings and the actual matching layer come in Step 4.

Patients, embeddings, matching, and the review API are added in Steps 4–6.

## Local setup

```bash
cd backend
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY if you want LLM-assisted eligibility
# parsing (Step 3) or LLM match summaries (Step 5) to work
```

From the project root (where `docker-compose.yml` lives):

```bash
docker compose up --build
```

> Older Docker installs use the hyphenated `docker-compose` instead of
> `docker compose` (with a space) — try whichever your install supports.

This starts:

| Service   | Port | Purpose                          |
|-----------|------|-----------------------------------|
| backend   | 8001 | FastAPI app                       |
| postgres  | 5432 | Trial/Patient/Match storage       |
| chromadb  | 8000 | Vector store for semantic search  |

Check it's alive:

```bash
curl http://localhost:8001/health
# {"status": "ok"}
```

Interactive API docs: http://localhost:8001/docs

### Running the ingestion pipeline

With `docker compose up` running:

```bash
docker exec -it onco_backend python -m app.ingestion.trials_ingest --max-trials 50
```

With a custom condition, or skipping the LLM fallback (no API key needed):

```bash
docker exec -it onco_backend python -m app.ingestion.trials_ingest --condition "breast cancer" --max-trials 100
docker exec -it onco_backend python -m app.ingestion.trials_ingest --max-trials 50 --no-llm-fallback
```

Then browse what was ingested:

```bash
curl http://localhost:8001/trials?limit=10
curl http://localhost:8001/trials/by-nct/NCT05123456
```

The response includes `eligibility_structured` with the parsed
inclusion/exclusion criteria, age range, biomarkers, and prior-treatment
mentions from Step 3.

## Running without Docker (optional, for quick iteration)

You'll need local Postgres and Chroma instances running first, with `.env`
pointed at `localhost` instead of the service names.

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Running tests

```bash
pytest
```

## Project layout

```
backend/
├── app/
│   ├── main.py            # FastAPI app + lifespan startup
│   ├── config.py          # Settings loaded from .env
│   ├── db.py               # Async SQLAlchemy engine/session/Base
│   ├── vectorstore.py      # ChromaDB client wrapper
│   ├── models/             # Trial, Patient, Match SQLAlchemy models
│   ├── schemas/            # Pydantic request/response schemas
│   ├── api/                # FastAPI routers (health.py, trials.py)
│   ├── ingestion/          # ClinicalTrials.gov client, normalizer,
│   │                       # text chunking, ingest pipeline (Step 2)
│   ├── nlp/                # Eligibility criteria parser (Step 3):
│   │                       # schema, section splitter, field extractors,
│   │                       # LLM fallback, main orchestrator
│   ├── embeddings/         # BioBERT embedder (Step 4)
│   └── matching/           # Semantic search + LLM summary (Step 4–5)
├── tests/
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Step 4 scope (BioBERT embeddings + semantic search)

- `app/embeddings/biobert_embedder.py` — wraps a biomedical
  sentence-transformer model (`pritamdeka/S-BioBert-snli-multinli-stsb`,
  768-dim, fine-tuned for sentence similarity) as a lazily-loaded singleton.
  Replaces the Step 2 placeholder (hash-based) embeddings entirely.
- `app/embeddings/patient_embedder.py` — builds a clinical-profile text
  summary from a `Patient` record (age, diagnosis, stage, biomarkers, prior
  treatment, free-text summary) and embeds it with the same model, so
  patient and trial vectors live in the same space.
- `app/matching/semantic_search.py` — `find_matching_trials(patient, top_k)`:
  embeds the patient, queries ChromaDB, converts cosine distance to a 0-1
  similarity score, returns ranked `TrialMatchCandidate` objects.
- `app/api/patients.py` — patient profile builder CRUD
  (`POST/GET/PATCH/DELETE /patients`)
- `app/api/matches.py` — `POST /patients/{id}/match` runs semantic search
  and persists results as `Match` rows; `GET /patients/{id}/matches` lists
  them. **No LLM eligibility summary yet** — `llm_summary` stays null until
  Step 5.
- `app/vectorstore.py` gained `delete_trials_collection()` — needed once,
  to wipe Step 2's placeholder 384-dim vectors before re-ingesting with
  Step 4's real 768-dim BioBERT vectors (ChromaDB collections are
  dimension-locked to whatever was first inserted).

### IMPORTANT — re-ingest after upgrading to Step 4

If you ran ingestion under Step 2/3 (placeholder embeddings), you must
re-ingest with `--reset-vectors` once before matching will work correctly,
since the old 384-dim vectors are incompatible with the new 768-dim model:

```bash
docker exec -it onco_backend python -m app.ingestion.trials_ingest --max-trials 50 --reset-vectors --no-llm-fallback
```

### Trying the matching pipeline

```bash
# 1. Create a patient
curl -X POST http://localhost:8001/patients -H "Content-Type: application/json" -d '{
  "display_name": "Test Patient",
  "age": 62,
  "sex": "FEMALE",
  "primary_diagnosis": "Stage III Non-Small Cell Lung Cancer",
  "cancer_type": "Lung Cancer",
  "stage": "III",
  "ecog_status": 1,
  "biomarkers": ["EGFR mutation positive"],
  "prior_treatments": ["Carboplatin", "Pemetrexed"]
}'

# 2. Run matching (use the patient id returned above)
curl -X POST http://localhost:8001/patients/{patient_id}/match -H "Content-Type: application/json" -d '{"top_k": 5}'

# 3. View saved matches
curl http://localhost:8001/patients/{patient_id}/matches
```

### Dependency note

`requirements.txt` uses version *ranges* for `transformers`/`sentence-transformers`/`torch`
(capped at `transformers<4.46.0`) rather than exact pins, specifically to
avoid the `tokenizers` version conflict with `chromadb==0.5.23` hit in
earlier steps (chromadb requires `tokenizers<=0.20.3`; `transformers>=4.46`
requires `tokenizers>=0.21`). If `pip install` ever reports a new conflict
here after a `chromadb` upgrade, check chroma-core/chroma's GitHub issues
for the current compatible `tokenizers` ceiling first.

LLM-generated eligibility summaries (the human-readable explanation of
*why* a trial matched) come in Step 5.
