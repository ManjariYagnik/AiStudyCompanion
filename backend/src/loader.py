"""Extract clean text from uploaded files, preserving page numbers where possible.

Each loader returns a list of (page_number, text) tuples. For formats without a
real page concept (txt/docx) we emit a single page numbered 1.
"""
from __future__ import annotations

import re
from pathlib import Path
from typing import List, Tuple

Page = Tuple[int, str]

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".docx"}


def _clean(text: str) -> str:
    """Normalise whitespace and drop empty lines without destroying structure."""
    # Collapse runs of spaces/tabs but keep newlines (paragraph/section breaks).
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse 3+ blank lines down to a single blank line.
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def load_pdf(path: Path) -> List[Page]:
    from pypdf import PdfReader

    reader = PdfReader(str(path))
    pages: List[Page] = []
    for i, page in enumerate(reader.pages, start=1):
        text = _clean(page.extract_text() or "")
        if text:  # skip empty pages
            pages.append((i, text))
    return pages


def load_txt(path: Path) -> List[Page]:
    text = _clean(path.read_text(encoding="utf-8", errors="ignore"))
    return [(1, text)] if text else []


def load_docx(path: Path) -> List[Page]:
    import docx

    document = docx.Document(str(path))
    text = _clean("\n".join(p.text for p in document.paragraphs))
    return [(1, text)] if text else []


def load_document(path: Path) -> List[Page]:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return load_pdf(path)
    if ext == ".txt":
        return load_txt(path)
    if ext == ".docx":
        return load_docx(path)
    raise ValueError(f"Unsupported file type: {ext}")
