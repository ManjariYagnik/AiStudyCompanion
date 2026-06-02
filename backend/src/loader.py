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


def _despace_line(line: str) -> str:
    """Repair PDFs that extract with a space between almost every glyph
    (e.g. 'D e cis i o n  f o r' -> 'Decision for').

    Heuristic, applied per line only when the line is dominated by
    single-character tokens. Real word breaks in these PDFs show up as 2+
    spaces, so we treat double spaces as boundaries and drop single spaces
    that sit between non-space characters.
    """
    tokens = line.split(" ")
    non_empty = [t for t in tokens if t]
    if len(non_empty) < 4:
        return line
    singles = sum(1 for t in non_empty if len(t) == 1)
    if singles / len(non_empty) < 0.4:
        return line  # looks like normal prose, leave it alone

    boundary = ""
    repaired = re.sub(r" {2,}", boundary, line)        # protect real word gaps
    repaired = re.sub(r"(?<=\S) (?=\S)", "", repaired)  # drop intra-word spaces
    return repaired.replace(boundary, " ")


def _clean(text: str) -> str:
    """Normalise whitespace and drop empty lines without destroying structure."""
    # Repair letter-spaced extraction line by line before collapsing whitespace.
    text = "\n".join(_despace_line(line) for line in text.splitlines())
    # Collapse runs of spaces/tabs but keep newlines (paragraph/section breaks).
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse 3+ blank lines down to a single blank line.
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def load_pdf(path: Path) -> List[Page]:
    # pdfplumber with a tight x_tolerance merges kerning-induced spurious spaces
    # (e.g. "f ollowing diagr am" -> "following diagram"), which pypdf leaves in.
    import pdfplumber

    pages: List[Page] = []
    with pdfplumber.open(str(path)) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = _clean(page.extract_text(x_tolerance=1) or "")
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
