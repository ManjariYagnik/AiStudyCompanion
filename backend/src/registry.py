"""A tiny JSON-backed registry of uploaded documents.

Chroma holds the vectors; this holds the human-facing document list (name,
size, status, timestamps) so the Documents page can render without scanning
the vector store.
"""
from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from .config import REGISTRY_PATH

_lock = threading.Lock()


def _read() -> Dict[str, dict]:
    if not REGISTRY_PATH.exists():
        return {}
    try:
        return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _write(data: Dict[str, dict]) -> None:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def upsert(doc: dict) -> dict:
    with _lock:
        data = _read()
        data[doc["id"]] = doc
        _write(data)
    return doc


def update(doc_id: str, **fields) -> Optional[dict]:
    with _lock:
        data = _read()
        if doc_id not in data:
            return None
        data[doc_id].update(fields)
        _write(data)
        return data[doc_id]


def remove(doc_id: str) -> bool:
    with _lock:
        data = _read()
        existed = data.pop(doc_id, None) is not None
        if existed:
            _write(data)
        return existed


def get(doc_id: str) -> Optional[dict]:
    return _read().get(doc_id)


def list_all() -> List[dict]:
    docs = list(_read().values())
    docs.sort(key=lambda d: d.get("createdAt", ""), reverse=True)
    return docs


def list_for_user(user_id: str) -> List[dict]:
    return [d for d in list_all() if d.get("userId") == user_id]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
