# AI Study Companion — Backend (RAG API)

Python + FastAPI service implementing the RAG pipeline from `plan.txt`:

```
Upload file → Extract text → Chunk → Embed → Store in Chroma
            → Retrieve relevant chunks → Send to LLM → Grounded answer + citations
```

**Stack:** FastAPI · LangChain · **Grok / xAI** (`grok-4.3`, OpenAI-compatible) for
generation · **local HuggingFace embeddings** (`BAAI/bge-small-en-v1.5`, no key) ·
ChromaDB (persistent, on disk).

> xAI has no embeddings endpoint, so embeddings run on-device via
> sentence-transformers. Indexing/upload therefore needs **no API key**; only
> generation (ask/summary/quiz) uses your `XAI_API_KEY`.

## Project structure

```
backend/
├── app.py              # FastAPI app + REST endpoints
├── requirements.txt
├── .env.example        # copy to .env and add your key
└── src/
    ├── config.py       # env config + paths
    ├── loader.py       # PDF / TXT / DOCX → text (per-page)
    ├── chunker.py      # token-based chunking w/ overlap
    ├── embeddings.py   # OpenAI embeddings factory
    ├── vectorstore.py  # Chroma add / search / delete
    ├── qa_chain.py     # grounded retrieval QA + citations
    ├── registry.py     # JSON registry of uploaded docs
    └── utils.py
```

`uploads/` (raw files) and `storage/` (Chroma index + `registry.json`) are created at
runtime and gitignored.

## Setup

```bash
cd backend
/opt/homebrew/bin/python3.12 -m venv .venv      # any Python 3.9+ works
.venv/bin/python -m pip install -r requirements.txt

cp .env.example .env
# edit .env and set XAI_API_KEY=xai-...   (from https://console.x.ai)
```

## Run

```bash
.venv/bin/python -m uvicorn main:app --reload --port 8000
```

The frontend (Next.js) calls `http://localhost:8000` by default. To point it
elsewhere, set `NEXT_PUBLIC_API_URL` in the Next app's `.env.local`.

## Endpoints

| Method | Path                  | Body                              | Returns |
|--------|-----------------------|-----------------------------------|---------|
| GET    | `/api/health`         | —                                 | `{ok, xaiKeyConfigured}` |
| GET    | `/api/documents`      | —                                 | `StudyDocument[]` |
| POST   | `/api/documents`      | multipart `file`                  | `StudyDocument` |
| DELETE | `/api/documents/{id}` | —                                 | `{ok}` |
| POST   | `/api/ask`            | `{question, documentId?}`         | `{answer, citations[]}` |
| POST   | `/api/ask/stream`     | `{question, documentId?}`         | SSE: `sources` event, then `token` events, then `done` |
| POST   | `/api/summary`        | `{documentId}`                    | `{title, source, bulletPoints[], keyConcepts[], importantTakeaways[]}` |
| POST   | `/api/quiz`           | `{documentId, difficulty, count}` | `{questions: [{question, options[4], correct, explanation}]}` |

`citations` are `{file, page, snippet}`, deduped by file+page.

## Config (env)

| Var | Default | Notes |
|-----|---------|-------|
| `XAI_API_KEY` | — | required for generation (ask/summary/quiz), not for indexing |
| `XAI_BASE_URL` | `https://api.x.ai/v1` | xAI OpenAI-compatible endpoint |
| `XAI_CHAT_MODEL` | `grok-4.3` | any current Grok model slug |
| `EMBED_MODEL` | `BAAI/bge-small-en-v1.5` | local sentence-transformers model (no key) |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | comma-separated |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `800` / `150` | tokens |
| `TOP_K` | `5` | chunks retrieved per question |

## Scope

Implements plan.txt steps 1–10 + 12:

- **Upload → extract → chunk → embed → store** (`loader`, `chunker`, `embeddings`, `vectorstore`)
- **Grounded QA with citations** (`qa_chain`) — step 8 + 12
- **Document summaries** (`summarizer`) — step 9; single-pass for short docs,
  map-reduce for long ones, structured output (title / key points / concepts /
  takeaways)
- **Quiz generation** (`quiz_generator`) — step 10; MCQs by difficulty with
  validated 4-option structure, correct index, and explanations

Not yet done (plan steps 14, 16–17): cross-document global search beyond the
optional `documentId` filter, polish (PDF/CSV export, chat history), and
deployment config.
