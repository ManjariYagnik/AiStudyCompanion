# AI Study Companion — Backend (RAG API)

Python + FastAPI service implementing the RAG pipeline from `plan.txt`:

```
Upload file → Extract text → Chunk → Embed → Store in Chroma
            → Retrieve relevant chunks → Send to LLM → Grounded answer + citations
```

**Stack:** FastAPI · LangChain · pluggable generation provider —
**Anthropic Claude** (`claude-opus-4-8`), **Ollama** (local, free), or **Grok/xAI** —
plus **local HuggingFace embeddings** (`BAAI/bge-small-en-v1.5`, no key) ·
ChromaDB (persistent, on disk).

> Embeddings always run on-device via sentence-transformers, so indexing/upload
> needs **no API key**. Only generation (ask/summary/quiz) uses the active
> provider's key. Switch providers with `LLM_PROVIDER` (`anthropic` | `ollama` | `xai`).

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
| GET    | `/api/health`         | —                                 | `{ok, provider, model, xaiKeyConfigured}` |
| POST   | `/api/auth/register`  | `{email, password, name?}`        | `{token, user}` |
| POST   | `/api/auth/login`     | `{email, password}`               | `{token, user}` |
| GET    | `/api/auth/me`        | (Bearer token)                    | `{id, email, name}` |
| GET    | `/api/documents`      | —                                 | `StudyDocument[]` |
| POST   | `/api/documents`      | multipart `file`                  | `StudyDocument` |
| DELETE | `/api/documents/{id}` | —                                 | `{ok}` |
| POST   | `/api/ask`            | `{question, documentId?}`         | `{answer, citations[]}` |
| POST   | `/api/ask/stream`     | `{question, documentId?}`         | SSE: `sources` event, then `token` events, then `done` |
| POST   | `/api/summary`        | `{documentId}`                    | `{title, source, bulletPoints[], keyConcepts[], importantTakeaways[]}` |
| POST   | `/api/quiz`           | `{documentId, difficulty, count}` | `{questions: [{question, options[4], correct, explanation}]}` |

`citations` are `{file, page, snippet}`, deduped by file+page.

All document/ask/summary/quiz endpoints require an `Authorization: Bearer <jwt>`
header and are **scoped to the authenticated user** — each user only sees and
queries their own documents.

## Config (env)

| Var | Default | Notes |
|-----|---------|-------|
| `LLM_PROVIDER` | `ollama` | `anthropic` \| `ollama` \| `xai` |
| `ANTHROPIC_API_KEY` | — | required when provider=anthropic (`sk-ant-...`) |
| `ANTHROPIC_CHAT_MODEL` | `claude-sonnet-4-6` | `claude-opus-4-8` (max quality) or `claude-haiku-4-5` (cheapest) |
| `XAI_API_KEY` | — | required when provider=xai |
| `XAI_CHAT_MODEL` | `grok-4.3` | any current Grok model slug |
| `EMBED_MODEL` | `BAAI/bge-small-en-v1.5` | local sentence-transformers model (no key) |
| `JWT_SECRET` | `dev-insecure-change-me` | **set a long random value in production** (`openssl rand -hex 32`) |
| `JWT_EXPIRE_DAYS` | `7` | session lifetime |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | comma-separated |
| `CHUNK_SIZE` / `CHUNK_OVERLAP` | `800` / `150` | tokens |
| `TOP_K` | `5` | chunks retrieved per question |

## OAuth (optional — Google / GitHub)

Email/password works out of the box. OAuth buttons appear on the login/register
pages **only when a provider is configured**. To enable one:

1. Create an OAuth app:
   - **Google** → https://console.cloud.google.com/apis/credentials (OAuth client ID, type "Web application")
   - **GitHub** → https://github.com/settings/developers (New OAuth App)
2. Set the **Authorized redirect URI** to:
   ```
   http://localhost:8000/api/auth/oauth/google/callback
   http://localhost:8000/api/auth/oauth/github/callback
   ```
   (use your real `OAUTH_REDIRECT_BASE` in production)
3. Put the client id/secret in `backend/.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.) and restart.

For a production deploy with **Google login only**, leave the GitHub variables
empty and configure:

```bash
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
OAUTH_REDIRECT_BASE=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

In Google Cloud Console, register this authorized redirect URI:

```text
https://your-backend-domain.com/api/auth/oauth/google/callback
```

The flow: frontend → `GET /api/auth/oauth/{provider}` → provider → `…/callback`
→ backend issues a JWT and redirects to `FRONTEND_URL/auth/callback?token=…`.
OAuth users are matched/created by email (linking to an existing email/password
account if one exists). Google accounts must have a verified email address.

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
