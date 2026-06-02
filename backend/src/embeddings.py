"""Local embedding model (HuggingFace sentence-transformers).

xAI/Grok has no embeddings endpoint, so we embed on-device. The model is
downloaded automatically on first use and cached; no API key is required.
"""
from __future__ import annotations

from functools import lru_cache

from .config import EMBED_MODEL


@lru_cache(maxsize=1)
def get_embeddings():
    from langchain_huggingface import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        encode_kwargs={"normalize_embeddings": True},
    )
