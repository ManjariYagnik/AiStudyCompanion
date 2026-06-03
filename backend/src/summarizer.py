"""Document summarization (plan.txt step 9).

For short documents we summarize in a single structured pass. For long ones we
map-reduce: summarize each chunk into a short note, then combine the notes into
the final structured summary. This keeps long PDFs within the model's context.
"""
from __future__ import annotations

from typing import AsyncIterator, List

from pydantic import BaseModel, Field

from .llm import STRUCTURED_OUTPUT_METHOD, count_tokens, get_chat_llm
from .vectorstore import get_document_chunks

# Above this combined token count we map-reduce instead of single-pass.
SINGLE_PASS_TOKEN_BUDGET = 10_000


class KeyConcept(BaseModel):
    term: str = Field(description="An important term, definition, or formula name")
    definition: str = Field(description="A concise explanation of the term")


class DocumentSummary(BaseModel):
    title: str = Field(description="A short descriptive title for the document")
    bulletPoints: List[str] = Field(description="5-8 key points from the material")
    keyConcepts: List[KeyConcept] = Field(description="4-6 important terms with definitions")
    importantTakeaways: List[str] = Field(description="3-5 high-level takeaways to remember")


_MAP_PROMPT = (
    "Summarize the following section of study notes in 2-4 concise sentences. "
    "Preserve important terms, definitions, and formulas.\n\nSection:\n{section}"
)

_REDUCE_SYSTEM = (
    "You are a study assistant. Produce a structured summary of the student's "
    "material using ONLY the provided content. Preserve key terms, definitions, "
    "and formulas. Keep points concise and exam-useful. Do not invent facts."
)


def _map_chunks(chunk_texts: List[str]) -> str:
    """Summarize each chunk, then join the mini-summaries."""
    llm = get_chat_llm()
    notes: List[str] = []
    for text in chunk_texts:
        resp = llm.invoke([("human", _MAP_PROMPT.format(section=text))])
        notes.append(resp.content if hasattr(resp, "content") else str(resp))
    return "\n".join(notes)


def summarize_document(doc_id: str) -> DocumentSummary:
    chunks = get_document_chunks(doc_id)
    if not chunks:
        raise ValueError("This document has no indexed content to summarize.")

    full_text = "\n\n".join(text for _page, text in chunks)

    if count_tokens(full_text) > SINGLE_PASS_TOKEN_BUDGET:
        context = _map_chunks([text for _page, text in chunks])
    else:
        context = full_text

    structured_llm = get_chat_llm().with_structured_output(
        DocumentSummary, method=STRUCTURED_OUTPUT_METHOD
    )
    return structured_llm.invoke(
        [
            ("system", _REDUCE_SYSTEM),
            ("human", f"Material:\n{context}\n\nGenerate the structured summary."),
        ]
    )


async def summarize_document_stream(doc_id: str) -> AsyncIterator[dict]:
    """Yield progress 'stage' events (so the UI can show what's happening) and
    finally a 'result' event with the structured summary.

    Summaries are structured JSON, so we don't stream tokens; instead we stream
    *stages* to mask the wait: reading -> summarizing (per section, for long
    docs) -> structuring -> result.
    """
    chunks = get_document_chunks(doc_id)
    if not chunks:
        raise ValueError("This document has no indexed content to summarize.")

    yield {"type": "stage", "stage": "reading"}
    texts = [text for _page, text in chunks]
    full_text = "\n\n".join(texts)

    if count_tokens(full_text) > SINGLE_PASS_TOKEN_BUDGET:
        llm = get_chat_llm()
        notes: List[str] = []
        total = len(texts)
        for i, text in enumerate(texts, start=1):
            yield {"type": "stage", "stage": "summarizing", "detail": f"{i}/{total}"}
            resp = await llm.ainvoke([("human", _MAP_PROMPT.format(section=text))])
            notes.append(resp.content if hasattr(resp, "content") else str(resp))
        context = "\n".join(notes)
    else:
        context = full_text

    yield {"type": "stage", "stage": "structuring"}
    structured_llm = get_chat_llm().with_structured_output(
        DocumentSummary, method=STRUCTURED_OUTPUT_METHOD
    )
    result = await structured_llm.ainvoke(
        [
            ("system", _REDUCE_SYSTEM),
            ("human", f"Material:\n{context}\n\nGenerate the structured summary."),
        ]
    )
    yield {"type": "result", "summary": result.model_dump()}
    yield {"type": "done"}
