# AI Study Companion — Backend (RAG API)

Python + FastAPI service implementing the RAG pipeline from `plan.txt`:

```
Upload file → Extract text → Chunk → Embed → Store in Chroma
            → Retrieve relevant chunks → Send to LLM → Grounded answer + citations
```

**Stack:** FastAPI · LangChain · OpenAI (`gpt-4o-mini` + `text-embedding-3-small`) · ChromaDB (persistent, on disk).

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
# edit .env and set OPENAI_API_KEY=sk-...
```

## Run

```bash
.venv/bin/python -m uvicorn app:app --reload --port 8000
```

The frontend (Next.js) calls `http://localhost:8000` by default. To point it
elsewhere, set `NEXT_PUBLIC_API_URL` in the Next app's `.env.local`.

## Endpoints

| Method | Path                  | Body                              | Returns |
|--------|-----------------------|-----------------------------------|---------|
| GET    | `/api/health`         | —                                 | `{ok, openaiKeyConfigured}` |
| GET    | `/api/documents`      | —                                 | `StudyDocument[]` |
| POST   | `/api/documents`      | multipart `file`                  | `StudyDocument` |
| DELETE | `/api/documents/{id}` | —                                 | `{ok}` |
| POST   | `/api/ask`            | `{question, documentId?}`         | `{answer, citations[]}` |

`citations` are `{file, page, snippet}`, deduped by file+page.

## Config (env)

| Var | Default | Notes |
|-----|---------|-------|
| `OPENAI_API_KEY` | — | required for embedding + answering |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` | |
| `OPENAI_EMBED_MODEL` | `text-embedding-3-small` | |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | comma-separated |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `800` / `150` | tokens |
| `TOP_K` | `5` | chunks retrieved per question |

## Scope

This implements the plan's **MVP QA slice** (steps 1–8 + 12): upload → extract →
chunk → embed → vector search → grounded answer with citations. Summaries
(step 9) and quiz generation (step 10) are not wired yet — the `summary` and
`quiz` pages still show placeholder UI.
