"""Document metadata, backed by the PostgreSQL `documents` table.

Public functions keep the same shape as before (dicts with camelCase keys the
frontend consumes), so callers don't change.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from .db import get_conn

# Columns a caller may update via update(**fields).
_UPDATABLE = {"name", "size", "status", "chunks", "pages", "error"}


def _row_to_doc(row: Optional[dict]) -> Optional[dict]:
    if not row:
        return None
    created = row.get("created_at")
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "name": row["name"],
        "size": row["size"],
        "status": row["status"],
        "chunks": row["chunks"],
        "pages": row["pages"],
        "error": row["error"],
        "createdAt": created.isoformat() if hasattr(created, "isoformat") else created,
    }


def upsert(doc: dict) -> dict:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO documents (id, user_id, name, size, status, chunks, pages, error, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, COALESCE(%s, now()))
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, size = EXCLUDED.size, status = EXCLUDED.status,
                chunks = EXCLUDED.chunks, pages = EXCLUDED.pages, error = EXCLUDED.error
            RETURNING *
            """,
            (
                doc["id"], doc.get("userId"), doc["name"], doc.get("size"),
                doc.get("status", "processing"), doc.get("chunks", 0),
                doc.get("pages", 0), doc.get("error"), doc.get("createdAt"),
            ),
        )
        return _row_to_doc(cur.fetchone())


def update(doc_id: str, **fields) -> Optional[dict]:
    cols = {k: v for k, v in fields.items() if k in _UPDATABLE}
    if not cols:
        return get(doc_id)
    assignments = ", ".join(f"{c} = %s" for c in cols)
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"UPDATE documents SET {assignments} WHERE id = %s RETURNING *",
            (*cols.values(), doc_id),
        )
        return _row_to_doc(cur.fetchone())


def remove(doc_id: str) -> bool:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("DELETE FROM documents WHERE id = %s", (doc_id,))
        return cur.rowcount > 0


def get(doc_id: str) -> Optional[dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM documents WHERE id = %s", (doc_id,))
        return _row_to_doc(cur.fetchone())


def list_all() -> List[dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM documents ORDER BY created_at DESC")
        return [_row_to_doc(r) for r in cur.fetchall()]


def list_for_user(user_id: str) -> List[dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM documents WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,),
        )
        return [_row_to_doc(r) for r in cur.fetchall()]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
