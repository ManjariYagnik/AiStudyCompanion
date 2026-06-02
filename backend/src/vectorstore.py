"""Persistent Chroma vector store wrapper.

Stores one Document per chunk with metadata {doc_id, file, page, chunk_index}
so retrieved chunks can be cited back to their source file and page.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List, Optional, Tuple

from .chunker import Chunk
from .config import CHROMA_DIR, COLLECTION_NAME
from .embeddings import get_embeddings


@lru_cache(maxsize=1)
def get_store():
    from langchain_chroma import Chroma

    return Chroma(
        collection_name=COLLECTION_NAME,
        embedding_function=get_embeddings(),
        persist_directory=str(CHROMA_DIR),
    )


def add_chunks(doc_id: str, file_name: str, chunks: List[Chunk]) -> int:
    """Embed and persist all chunks for a document. Returns the count added."""
    from langchain_core.documents import Document

    store = get_store()
    documents = [
        Document(
            page_content=c.text,
            metadata={
                "doc_id": doc_id,
                "file": file_name,
                "page": c.page,
                "chunk_index": c.index,
            },
        )
        for c in chunks
    ]
    ids = [f"{doc_id}:{c.index}" for c in chunks]
    if documents:
        store.add_documents(documents, ids=ids)
    return len(documents)


def delete_document(doc_id: str) -> None:
    get_store().delete(where={"doc_id": doc_id})


def search(query: str, k: int, doc_id: Optional[str] = None) -> List[Tuple[object, float]]:
    """Return (Document, distance) pairs most relevant to the query."""
    store = get_store()
    where = {"doc_id": doc_id} if doc_id else None
    return store.similarity_search_with_score(query, k=k, filter=where)
