"""SQLite-backed user store (email + hashed password)."""
from __future__ import annotations

import sqlite3
import threading
from datetime import datetime, timezone
from typing import Optional

from .config import USERS_DB_PATH

_lock = threading.Lock()


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(USERS_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _lock, _conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                email         TEXT UNIQUE NOT NULL,
                name          TEXT,
                password_hash TEXT NOT NULL,
                created_at    TEXT NOT NULL
            )
            """
        )


def create_user(user_id: str, email: str, name: str, password_hash: str) -> dict:
    with _lock, _conn() as conn:
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, created_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (user_id, email, name, password_hash, datetime.now(timezone.utc).isoformat()),
        )
    return {"id": user_id, "email": email, "name": name}


def get_by_email(email: str) -> Optional[dict]:
    with _conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    return dict(row) if row else None


def get_by_id(user_id: str) -> Optional[dict]:
    with _conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None
