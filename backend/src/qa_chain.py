"""Retrieval-augmented question answering, grounded in retrieved chunks.

Flow: embed question -> retrieve top-k chunks (optionally scoped to one doc)
-> build a context block tagged with sources -> ask the LLM to answer ONLY
from that context -> return the answer plus deduped citations.
"""
from __future__ import annotations

from typing import List, Optional, TypedDict

from .config import TOP_K
from .llm import get_chat_llm
from .vectorstore import search

SYSTEM_PROMPT = (
    "You are a study assistant. Answer the user's question using ONLY the "
    "provided context from their study materials. Follow these rules strictly:\n"
    "- If the answer is not contained in the context, say: \"I couldn't find "
    "that in your documents.\" Do not use outside knowledge.\n"
    "- Keep the answer concise and clear.\n"
    "- When useful, refer to the source like (Biology Notes.pdf, p.12).\n"
    "- Do not invent page numbers or sources."
)


class Citation(TypedDict):
    file: str
    page: int
    snippet: str


class Answer(TypedDict):
    answer: str
    citations: List[Citation]


def _format_context(docs) -> str:
    blocks = []
    for d in docs:
        file = d.metadata.get("file", "unknown")
        page = d.metadata.get("page", "?")
        blocks.append(f"[Source: {file}, p.{page}]\n{d.page_content}")
    return "\n\n---\n\n".join(blocks)


def _snippet(text: str, limit: int = 240) -> str:
    text = " ".join(text.split())
    return text if len(text) <= limit else text[:limit].rstrip() + "..."


def answer_question(question: str, doc_id: Optional[str] = None) -> Answer:
    results = search(question, k=TOP_K, doc_id=doc_id)
    docs = [doc for doc, _score in results]

    if not docs:
        return Answer(
            answer="I couldn't find that in your documents. Try uploading "
            "relevant material first.",
            citations=[],
        )

    context = _format_context(docs)
    llm = get_chat_llm()
    response = llm.invoke(
        [
            ("system", SYSTEM_PROMPT),
            ("human", f"Context:\n{context}\n\nQuestion: {question}"),
        ]
    )
    answer_text = response.content if hasattr(response, "content") else str(response)

    # Dedupe citations by (file, page), preserving retrieval order.
    seen = set()
    citations: List[Citation] = []
    for d in docs:
        key = (d.metadata.get("file"), d.metadata.get("page"))
        if key in seen:
            continue
        seen.add(key)
        citations.append(
            Citation(
                file=d.metadata.get("file", "unknown"),
                page=int(d.metadata.get("page", 0)),
                snippet=_snippet(d.page_content),
            )
        )

    return Answer(answer=answer_text.strip(), citations=citations)
