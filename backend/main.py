"""AI Study Companion backend — FastAPI REST API.

Endpoints:
  GET    /api/health
  GET    /api/documents
  POST   /api/documents      (multipart: file)
  DELETE /api/documents/{id}
  POST   /api/ask            (json: {question, documentId?})
"""
from __future__ import annotations

import json
import re
import uuid

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src import registry, users
from src.auth import create_access_token, decode_token, hash_password, verify_password
from src.chunker import chunk_pages
from src.config import ALLOWED_ORIGINS, CHAT_MODEL, LLM_PROVIDER, UPLOADS_DIR, XAI_API_KEY
from src.loader import SUPPORTED_EXTENSIONS, load_document
from src.utils import human_size

app = FastAPI(title="AI Study Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

users.init_db()

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    """Resolve the user from a `Authorization: Bearer <jwt>` header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(authorization.split(" ", 1)[1].strip())
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    user = users.get_by_id(payload["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="User no longer exists")
    return user


def _public_user(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"], "name": user.get("name")}


@app.post("/api/auth/register")
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    if not _EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if users.get_by_email(email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user_id = uuid.uuid4().hex
    name = (req.name or email.split("@")[0]).strip()
    users.create_user(user_id, email, name, hash_password(req.password))
    token = create_access_token(user_id, email)
    return {"token": token, "user": {"id": user_id, "email": email, "name": name}}


@app.post("/api/auth/login")
def login(req: LoginRequest):
    email = req.email.strip().lower()
    user = users.get_by_email(email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")
    token = create_access_token(user["id"], user["email"])
    return {"token": token, "user": _public_user(user)}


@app.get("/api/auth/me")
def me(user: dict = Depends(get_current_user)):
    return _public_user(user)


@app.get("/api/auth/providers")
def auth_providers():
    """Which OAuth providers are configured (so the UI shows the right buttons)."""
    from src import oauth

    return oauth.enabled_providers()


@app.get("/api/auth/oauth/{provider}")
def oauth_login(provider: str):
    from fastapi.responses import RedirectResponse

    from src import oauth

    if not oauth.is_enabled(provider):
        raise HTTPException(status_code=404, detail="This sign-in method is not configured.")
    return RedirectResponse(oauth.authorize_url(provider))


@app.get("/api/auth/oauth/{provider}/callback")
async def oauth_callback(provider: str, code: str = "", state: str = "", error: str = ""):
    from urllib.parse import urlencode

    from fastapi.responses import RedirectResponse

    from src import oauth
    from src.config import FRONTEND_URL

    def back(params: dict) -> RedirectResponse:
        return RedirectResponse(f"{FRONTEND_URL}/auth/callback?{urlencode(params)}")

    if error or not code:
        return back({"error": error or "Sign-in was cancelled."})
    if not oauth.is_enabled(provider) or not oauth.verify_state(provider, state):
        return back({"error": "Invalid or expired sign-in attempt."})

    try:
        profile = await oauth.exchange_code_for_profile(provider, code)
    except Exception:  # noqa: BLE001
        profile = None
    if not profile:
        return back({"error": "Could not sign you in with this provider."})

    user = users.get_or_create_oauth_user(profile["email"], profile["name"])
    token = create_access_token(user["id"], user["email"])
    return back({"token": token})


class AskRequest(BaseModel):
    question: str
    documentId: str | None = None


class SummaryRequest(BaseModel):
    documentId: str


class QuizRequest(BaseModel):
    documentId: str
    difficulty: str = "medium"
    count: int = 5


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "provider": LLM_PROVIDER,
        "model": CHAT_MODEL,
        # Only relevant when provider=xai; local Ollama needs no key.
        "xaiKeyConfigured": bool(XAI_API_KEY),
    }


@app.get("/api/documents")
def list_documents(user: dict = Depends(get_current_user)):
    return registry.list_for_user(user["id"])


@app.post("/api/documents")
async def upload_document(
    file: UploadFile = File(...), user: dict = Depends(get_current_user)
):
    original_name = file.filename or "untitled"
    ext = "." + original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: PDF, TXT, DOCX.",
        )

    doc_id = uuid.uuid4().hex
    saved_path = UPLOADS_DIR / f"{doc_id}{ext}"
    contents = await file.read()
    saved_path.write_bytes(contents)

    # Register immediately as "processing" so the UI can show it right away.
    doc = registry.upsert(
        {
            "id": doc_id,
            "userId": user["id"],
            "name": original_name,
            "size": human_size(len(contents)),
            "status": "processing",
            "chunks": 0,
            "pages": 0,
            "createdAt": registry.now_iso(),
        }
    )

    try:
        pages = load_document(saved_path)
        if not pages:
            raise ValueError("No extractable text found in this file.")
        chunks = chunk_pages(pages)

        # Importing here keeps non-LLM endpoints usable without an API key.
        from src.vectorstore import add_chunks

        added = add_chunks(doc_id, original_name, chunks, user_id=user["id"])
        doc = registry.update(
            doc_id,
            status="indexed",
            chunks=added,
            pages=len(pages),
        )
    except Exception as exc:  # noqa: BLE001 - surface the reason to the client
        registry.update(doc_id, status="failed", error=str(exc))
        raise HTTPException(status_code=500, detail=f"Failed to index document: {exc}")

    return doc


@app.delete("/api/documents/{doc_id}")
def delete_document_endpoint(doc_id: str, user: dict = Depends(get_current_user)):
    doc = registry.get(doc_id)
    if not doc or doc.get("userId") != user["id"]:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove vectors (best-effort; needs the key to construct the store).
    try:
        from src.vectorstore import delete_document

        delete_document(doc_id)
    except Exception:  # noqa: BLE001 - registry removal still proceeds
        pass

    registry.remove(doc_id)
    return {"ok": True}


@app.post("/api/ask")
def ask(req: AskRequest, user: dict = Depends(get_current_user)):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    from src.qa_chain import answer_question

    try:
        return answer_question(question, doc_id=req.documentId, user_id=user["id"])
    except RuntimeError as exc:  # missing API key
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Answering failed: {exc}")


@app.post("/api/ask/stream")
async def ask_stream(req: AskRequest, user: dict = Depends(get_current_user)):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    from src.qa_chain import answer_question_stream

    async def event_source():
        try:
            async for event in answer_question_stream(
                question, doc_id=req.documentId, user_id=user["id"]
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except RuntimeError as exc:  # missing API key / provider unreachable
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'detail': f'Answering failed: {exc}'})}\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _require_doc(doc_id: str, user: dict) -> dict:
    doc = registry.get(doc_id)
    if not doc or doc.get("userId") != user["id"]:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("status") != "indexed":
        raise HTTPException(
            status_code=400, detail="Document is not indexed yet. Try again shortly."
        )
    return doc


@app.post("/api/summary")
def summary(req: SummaryRequest, user: dict = Depends(get_current_user)):
    doc = _require_doc(req.documentId, user)

    from src.summarizer import summarize_document

    try:
        result = summarize_document(req.documentId)
    except RuntimeError as exc:  # missing API key
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Summary failed: {exc}")

    payload = result.model_dump()
    payload["source"] = doc["name"]
    return payload


@app.post("/api/summary/stream")
async def summary_stream(req: SummaryRequest, user: dict = Depends(get_current_user)):
    doc = _require_doc(req.documentId, user)

    from src.summarizer import summarize_document_stream

    async def event_source():
        try:
            async for event in summarize_document_stream(req.documentId):
                if event.get("type") == "result":
                    event["summary"]["source"] = doc["name"]
                yield f"data: {json.dumps(event)}\n\n"
        except RuntimeError as exc:  # missing API key / provider unreachable
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"
        except ValueError as exc:
            yield f"data: {json.dumps({'type': 'error', 'detail': str(exc)})}\n\n"
        except Exception as exc:  # noqa: BLE001
            yield f"data: {json.dumps({'type': 'error', 'detail': f'Summary failed: {exc}'})}\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/api/quiz")
def quiz(req: QuizRequest, user: dict = Depends(get_current_user)):
    _require_doc(req.documentId, user)

    from src.quiz_generator import generate_quiz

    try:
        result = generate_quiz(req.documentId, difficulty=req.difficulty, count=req.count)
    except RuntimeError as exc:  # missing API key
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {exc}")

    return result.model_dump()
