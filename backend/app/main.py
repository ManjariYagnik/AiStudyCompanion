from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile

from .extraction import (
    DocxNotImplementedError,
    ExtractionError,
    UnsupportedFileTypeError,
    extract_document,
)

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024

app = FastAPI(
    title="Study Companion Document API",
    version="0.1.0",
    description="Upload and extract text from PDF/TXT documents.",
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)) -> dict:
    file_name = file.filename or "uploaded-file"
    data = await file.read()

    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds the 50MB upload limit.")

    try:
        extraction = extract_document(file_name, file.content_type, data)
    except DocxNotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc
    except ExtractionError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=500,
            detail="Unexpected extraction error while processing file.",
        ) from exc

    return {
        "file_name": file_name,
        "file_size": len(data),
        "type": extraction.type,
        "text": extraction.text,
        "section_break_marker": extraction.section_break_marker,
        "page_count": len(extraction.sections),
        "sections": [
            {
                "page_number": section.page_number,
                "char_count": len(section.text),
                "preview": f"{section.text[:240].rstrip()}..."
                if len(section.text) > 240
                else section.text,
            }
            for section in extraction.sections
        ],
    }
