"""Central configuration loaded from environment / .env."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env regardless of the working directory the server is started from.
BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

# Generation provider: "anthropic" (Claude), "ollama" (local, free), or "xai" (Grok).
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").strip().lower()

# Ollama (local LLM). Requires `ollama serve` running and the model pulled.
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# Grok / xAI (OpenAI-compatible chat API), used only when LLM_PROVIDER=xai.
XAI_API_KEY = os.getenv("XAI_API_KEY", "").strip()
# Treat the example placeholder as "not set" so health checks stay honest.
if XAI_API_KEY in {"xai-...", "sk-..."}:
    XAI_API_KEY = ""
XAI_BASE_URL = os.getenv("XAI_BASE_URL", "https://api.x.ai/v1")
XAI_CHAT_MODEL = os.getenv("XAI_CHAT_MODEL", "grok-4.3")

# Anthropic Claude (Messages API), used only when LLM_PROVIDER=anthropic.
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
if ANTHROPIC_API_KEY in {"sk-ant-...", "sk-...", "xai-..."}:
    ANTHROPIC_API_KEY = ""
ANTHROPIC_CHAT_MODEL = os.getenv("ANTHROPIC_CHAT_MODEL", "claude-sonnet-4-6")
ANTHROPIC_MAX_TOKENS = int(os.getenv("ANTHROPIC_MAX_TOKENS", "2048"))

# The model name surfaced in health/UI for the active provider.
if LLM_PROVIDER == "ollama":
    CHAT_MODEL = OLLAMA_MODEL
elif LLM_PROVIDER == "anthropic":
    CHAT_MODEL = ANTHROPIC_CHAT_MODEL
else:
    CHAT_MODEL = XAI_CHAT_MODEL

# Local sentence-transformers model (downloaded on first use, no API key).
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-small-en-v1.5")

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))
TOP_K = int(os.getenv("TOP_K", "5"))

# On-disk locations (gitignored). Uploads are still stored on disk; all
# structured data + embeddings now live in PostgreSQL.
UPLOADS_DIR = BACKEND_DIR / "uploads"
STORAGE_DIR = BACKEND_DIR / "storage"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# PostgreSQL (relational data) + pgvector (embeddings). Use the SQLAlchemy-style
# URL with the psycopg driver; langchain-postgres requires psycopg3.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://study:studypass@localhost:5432/studycompanion",
)

COLLECTION_NAME = "study_companion"

# Auth — JWT signing. Override JWT_SECRET in production (.env).
JWT_SECRET = os.getenv("JWT_SECRET", "dev-insecure-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

# OAuth (Google / GitHub). Each provider activates only when its client
# id+secret are set. Create apps in the provider consoles and register the
# redirect URI: {OAUTH_REDIRECT_BASE}/api/auth/oauth/{provider}/callback
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")
# Where the provider redirects back (this backend), and where we send the user
# afterwards (the Next.js app).
OAUTH_REDIRECT_BASE = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def require_xai_key() -> str:
    """Fail loudly with a helpful message when the xAI key is missing."""
    if not XAI_API_KEY:
        raise RuntimeError(
            "XAI_API_KEY is not set. Copy backend/.env.example to backend/.env "
            "and add your xAI (Grok) key. Get one at https://console.x.ai"
        )
    return XAI_API_KEY


def require_anthropic_key() -> str:
    """Fail loudly with a helpful message when the Anthropic key is missing."""
    if not ANTHROPIC_API_KEY:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Add your Anthropic API key (sk-ant-...) "
            "to backend/.env. Create one at https://console.anthropic.com/settings/keys"
        )
    return ANTHROPIC_API_KEY
