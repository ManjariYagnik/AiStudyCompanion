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
import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src import registry
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
def list_documents():
    return registry.list_all()


@app.post("/api/documents")
async def upload_document(file: UploadFile = File(...)):
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

        added = add_chunks(doc_id, original_name, chunks)
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
def delete_document_endpoint(doc_id: str):
    if not registry.get(doc_id):
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
def ask(req: AskRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    from src.qa_chain import answer_question

    try:
        return answer_question(question, doc_id=req.documentId)
    except RuntimeError as exc:  # missing API key
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Answering failed: {exc}")


@app.post("/api/ask/stream")
async def ask_stream(req: AskRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    from src.qa_chain import answer_question_stream

    async def event_source():
        try:
            async for event in answer_question_stream(question, doc_id=req.documentId):
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


def _require_doc(doc_id: str) -> dict:
    doc = registry.get(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.get("status") != "indexed":
        raise HTTPException(
            status_code=400, detail="Document is not indexed yet. Try again shortly."
        )
    return doc


@app.post("/api/summary")
def summary(req: SummaryRequest):
    doc = _require_doc(req.documentId)

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


@app.post("/api/quiz")
def quiz(req: QuizRequest):
    _require_doc(req.documentId)

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
