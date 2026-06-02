from __future__ import annotations

import re
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

SECTION_BREAK_MARKER = "=== Section Break ==="
MAX_HEADER_LINES = 2
MAX_FOOTER_LINES = 2
HEADER_FOOTER_REPEAT_RATIO = 0.6

PDF_CONTENT_TYPE = "application/pdf"
TXT_CONTENT_TYPE_PREFIX = "text/plain"
DOCX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


class ExtractionError(Exception):
    """Base extraction error."""


class UnsupportedFileTypeError(ExtractionError):
    """Raised when file type is not supported."""


class DocxNotImplementedError(ExtractionError):
    """Raised for DOCX files until implemented."""


@dataclass
class RawSection:
    page_number: int
    lines: list[str]


@dataclass
class ExtractedSection:
    page_number: int
    text: str


@dataclass
class ExtractionResult:
    type: str
    text: str
    sections: list[ExtractedSection]
    section_break_marker: str = SECTION_BREAK_MARKER


def _sanitize_line(line: str) -> str:
    return re.sub(r"[ \t]+", " ", line.replace("\u00a0", " ")).strip()


def _normalize_line(line: str) -> str:
    normalized = line.lower().replace("\u00a0", " ")
    normalized = re.sub(r"\s+", " ", normalized)
    normalized = re.sub(r"[^a-z0-9\s#]", "", normalized)
    normalized = re.sub(r"\d+", "#", normalized)
    return normalized.strip()


def _normalize_line_for_dedupe(line: str) -> str:
    normalized = line.lower().replace("\u00a0", " ")
    return re.sub(r"\s+", " ", normalized).strip()


def _is_likely_page_counter(line: str) -> bool:
    cleaned = line.strip().lower()
    if not cleaned:
        return False
    return bool(
        re.fullmatch(r"(?:page\s*)?\d+(?:\s*/\s*\d+)?", cleaned)
        or re.fullmatch(r"(?:page\s*)?[ivxlcdm]+", cleaned)
    )


def _dedupe_consecutive_lines(lines: list[str]) -> list[str]:
    deduped: list[str] = []
    for line in lines:
        previous = deduped[-1] if deduped else None
        if previous and _normalize_line_for_dedupe(previous) == _normalize_line_for_dedupe(
            line
        ):
            continue
        deduped.append(line)
    return deduped


def _to_extracted_sections(sections: list[RawSection]) -> list[ExtractedSection]:
    extracted: list[ExtractedSection] = []
    for section in sections:
        cleaned_lines = _dedupe_consecutive_lines(
            [s for s in (_sanitize_line(line) for line in section.lines) if s]
        )
        if not cleaned_lines:
            continue
        extracted.append(
            ExtractedSection(page_number=section.page_number, text="\n".join(cleaned_lines))
        )
    return extracted


def _collect_edge_line_counts(
    sections: list[RawSection],
) -> tuple[set[str], set[str]]:
    header_counts: dict[str, int] = {}
    footer_counts: dict[str, int] = {}

    for section in sections:
        if not section.lines:
            continue

        header_candidates = section.lines[:MAX_HEADER_LINES]
        footer_candidates = section.lines[-MAX_FOOTER_LINES:]

        for candidate in set(header_candidates):
            normalized = _normalize_line(candidate)
            if len(normalized) >= 4:
                header_counts[normalized] = header_counts.get(normalized, 0) + 1

        for candidate in set(footer_candidates):
            normalized = _normalize_line(candidate)
            if len(normalized) >= 4:
                footer_counts[normalized] = footer_counts.get(normalized, 0) + 1

    threshold = max(2, int(len(sections) * HEADER_FOOTER_REPEAT_RATIO + 0.999))
    repeated_headers = {line for line, count in header_counts.items() if count >= threshold}
    repeated_footers = {line for line, count in footer_counts.items() if count >= threshold}
    return repeated_headers, repeated_footers


def _clean_sections(sections: list[RawSection]) -> list[ExtractedSection]:
    if not sections:
        return []

    repeated_headers, repeated_footers = _collect_edge_line_counts(sections)
    cleaned_sections: list[RawSection] = []

    for section in sections:
        lines = list(section.lines)

        while lines:
            first = lines[0]
            normalized = _normalize_line(first)
            if not first or normalized in repeated_headers or _is_likely_page_counter(first):
                lines.pop(0)
                continue
            break

        while lines:
            last = lines[-1]
            normalized = _normalize_line(last)
            if not last or normalized in repeated_footers or _is_likely_page_counter(last):
                lines.pop()
                continue
            break

        cleaned_sections.append(RawSection(page_number=section.page_number, lines=lines))

    return _to_extracted_sections(cleaned_sections)


def _serialize_sections(sections: list[ExtractedSection]) -> str:
    return f"\n\n{SECTION_BREAK_MARKER}\n\n".join(section.text for section in sections)


def _normalize_plain_text(raw: str) -> str:
    text = raw.replace("\r\n", "\n").replace("\r", "\n").replace("\u00a0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_pdf_sections(data: bytes) -> list[RawSection]:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise ExtractionError(
            "Missing dependency: install `pypdf` to enable PDF extraction."
        ) from exc

    reader = PdfReader(BytesIO(data))
    sections: list[RawSection] = []

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        lines = [_sanitize_line(line) for line in page_text.splitlines()]
        lines = [line for line in lines if line]
        sections.append(RawSection(page_number=page_number, lines=lines))

    return sections


def _extract_txt_sections(data: bytes) -> tuple[list[RawSection], bool]:
    raw_text = data.decode("utf-8", errors="replace")
    normalized = _normalize_plain_text(raw_text)
    if not normalized:
        return [], False

    if "\f" in normalized:
        sections: list[RawSection] = []
        for idx, segment in enumerate(re.split(r"\f+", normalized), start=1):
            lines = [_sanitize_line(line) for line in _normalize_plain_text(segment).split("\n")]
            lines = [line for line in lines if line]
            if lines:
                sections.append(RawSection(page_number=idx, lines=lines))
        return sections, True

    sections = []
    for idx, chunk in enumerate(re.split(r"\n{2,}", normalized), start=1):
        lines = [_sanitize_line(line) for line in chunk.split("\n")]
        lines = [line for line in lines if line]
        if lines:
            sections.append(RawSection(page_number=idx, lines=lines))
    return sections, False


def _resolve_file_type(file_name: str, content_type: str | None) -> str:
    suffix = Path(file_name.lower()).suffix
    normalized_type = (content_type or "").lower()

    if suffix == ".pdf" or normalized_type == PDF_CONTENT_TYPE:
        return "pdf"
    if suffix == ".txt" or normalized_type.startswith(TXT_CONTENT_TYPE_PREFIX):
        return "txt"
    if suffix == ".docx" or normalized_type == DOCX_CONTENT_TYPE:
        return "docx"
    return "unsupported"


def extract_document(file_name: str, content_type: str | None, data: bytes) -> ExtractionResult:
    file_type = _resolve_file_type(file_name, content_type)

    if file_type == "docx":
        raise DocxNotImplementedError(
            "DOCX extraction is not implemented yet. Please upload PDF or TXT for now."
        )
    if file_type == "unsupported":
        raise UnsupportedFileTypeError(
            "Unsupported file type. Only PDF and TXT are currently supported."
        )

    if file_type == "pdf":
        raw_sections = _extract_pdf_sections(data)
        sections = _clean_sections(raw_sections)
        return ExtractionResult(type="pdf", text=_serialize_sections(sections), sections=sections)

    raw_sections, has_explicit_page_breaks = _extract_txt_sections(data)
    sections = (
        _clean_sections(raw_sections)
        if has_explicit_page_breaks
        else _to_extracted_sections(raw_sections)
    )
    return ExtractionResult(type="txt", text=_serialize_sections(sections), sections=sections)
