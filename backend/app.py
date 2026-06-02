"""AI Study Companion backend — FastAPI REST API.

Endpoints:
  GET    /api/health
  GET    /api/documents
  POST   /api/documents      (multipart: file)
  DELETE /api/documents/{id}
  POST   /api/ask            (json: {question, documentId?})
"""
from __future__ import annotations

import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src import registry
from src.chunker import chunk_pages
from src.config import ALLOWED_ORIGINS, OPENAI_API_KEY, UPLOADS_DIR
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


@app.get("/api/health")
def health():
    return {"ok": True, "openaiKeyConfigured": bool(OPENAI_API_KEY)}


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
