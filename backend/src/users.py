"""User store (email + hashed password), backed by PostgreSQL."""
from __future__ import annotations

import uuid
from typing import Optional

from .db import get_conn, init_db as _init_db

# Stored as the password hash for OAuth-only accounts; never matches a real
# bcrypt hash, so password login for these users always fails.
OAUTH_SENTINEL = "!oauth-no-password"


def init_db() -> None:
    _init_db()


def create_user(user_id: str, email: str, name: str, password_hash: str) -> dict:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "INSERT INTO users (id, email, name, password_hash) VALUES (%s, %s, %s, %s)",
            (user_id, email, name, password_hash),
        )
    return {"id": user_id, "email": email, "name": name}


def get_by_email(email: str) -> Optional[dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cur.fetchone()


def get_by_id(user_id: str) -> Optional[dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cur.fetchone()


def get_or_create_oauth_user(email: str, name: str) -> dict:
    """Look up by email; create a password-less account if new. Links an OAuth
    sign-in to any existing email/password account with the same email."""
    existing = get_by_email(email)
    if existing:
        return existing
    return create_user(uuid.uuid4().hex, email, name, OAUTH_SENTINEL)
