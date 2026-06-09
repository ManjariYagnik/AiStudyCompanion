"""Vector store backed by PostgreSQL + pgvector (via langchain-postgres).

Embeddings live in the same database as users/documents. Each chunk stores
metadata {doc_id, file, page, chunk_index, user_id} so we can cite sources,
scope retrieval per user, and fetch/delete a document's chunks.
"""
from __future__ import annotations

from functools import lru_cache
from typing import List, Optional, Tuple

from .chunker import Chunk
from .config import COLLECTION_NAME, DATABASE_URL
from .db import get_conn
from .embeddings import get_embeddings


@lru_cache(maxsize=1)
def get_store():
    from langchain_postgres import PGVector

    return PGVector(
        embeddings=get_embeddings(),
        collection_name=COLLECTION_NAME,
        connection=DATABASE_URL,
        use_jsonb=True,
    )


def add_chunks(doc_id: str, file_name: str, chunks: List[Chunk], user_id: str = "") -> int:
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
                "user_id": user_id,
            },
        )
        for c in chunks
    ]
    ids = [f"{doc_id}:{c.index}" for c in chunks]
    if documents:
        store.add_documents(documents, ids=ids)
    return len(documents)


def delete_document(doc_id: str) -> None:
    # Delete straight from langchain-postgres's embedding table by metadata.
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM langchain_pg_embedding WHERE cmetadata->>'doc_id' = %s",
            (doc_id,),
        )


def _eq(key: str, value: str) -> dict:
    return {key: {"$eq": value}}


def search(
    query: str,
    k: int,
    doc_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> List[Tuple[object, float]]:
    """Most-relevant (Document, distance) pairs, scoped to the user (and
    optionally a single document)."""
    store = get_store()
    clauses = []
    if user_id:
        clauses.append(_eq("user_id", user_id))
    if doc_id:
        clauses.append(_eq("doc_id", doc_id))

    if len(clauses) > 1:
        where = {"$and": clauses}
    elif clauses:
        where = clauses[0]
    else:
        where = None

    return store.similarity_search_with_score(query, k=k, filter=where)


def get_document_chunks(doc_id: str) -> List[Tuple[int, str]]:
    """All chunks for a document as (page, text), ordered by chunk index."""
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT document, cmetadata
            FROM langchain_pg_embedding
            WHERE cmetadata->>'doc_id' = %s
            ORDER BY (cmetadata->>'chunk_index')::int
            """,
            (doc_id,),
        )
        rows = cur.fetchall()
    return [(int(r["cmetadata"].get("page", 1)), r["document"]) for r in rows]
