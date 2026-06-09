"""PostgreSQL connection + schema.

One database holds everything: `users` and `documents` tables (here) plus the
pgvector embedding tables (managed by langchain-postgres in vectorstore.py).
"""
from __future__ import annotations

import psycopg
from psycopg.rows import dict_row

from .config import DATABASE_URL


def _dsn() -> str:
    # psycopg wants a plain libpq URL, without SQLAlchemy's "+psycopg" driver tag.
    return DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")


def get_conn() -> psycopg.Connection:
    """A new connection with dict rows. Use as `with get_conn() as conn:`
    (psycopg commits on clean exit and closes the connection)."""
    return psycopg.connect(_dsn(), row_factory=dict_row)


def init_db() -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                email         TEXT UNIQUE NOT NULL,
                name          TEXT,
                password_hash TEXT NOT NULL,
                created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id         TEXT PRIMARY KEY,
                user_id    TEXT NOT NULL,
                name       TEXT NOT NULL,
                size       TEXT,
                status     TEXT NOT NULL,
                chunks     INTEGER NOT NULL DEFAULT 0,
                pages      INTEGER NOT NULL DEFAULT 0,
                error      TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
        cur.execute("CREATE INDEX IF NOT EXISTS documents_user_idx ON documents(user_id)")
