"""OpenAI embedding model factory."""
from __future__ import annotations

from functools import lru_cache

from .config import EMBED_MODEL, require_api_key


@lru_cache(maxsize=1)
def get_embeddings():
    from langchain_openai import OpenAIEmbeddings

    return OpenAIEmbeddings(model=EMBED_MODEL, api_key=require_api_key())
