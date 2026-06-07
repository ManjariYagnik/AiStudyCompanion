"""Shared OpenAI chat-model factory and token helpers."""
from __future__ import annotations

from functools import lru_cache

from .config import (
    ANTHROPIC_CHAT_MODEL,
    ANTHROPIC_MAX_TOKENS,
    LLM_PROVIDER,
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    XAI_BASE_URL,
    XAI_CHAT_MODEL,
    require_anthropic_key,
    require_xai_key,
)

# Structured output (summary/quiz) method per provider: Ollama uses native JSON
# schema; Anthropic (Claude) and xAI/Grok use tool/function calling.
STRUCTURED_OUTPUT_METHOD = "json_schema" if LLM_PROVIDER == "ollama" else "function_calling"


@lru_cache(maxsize=4)
def get_chat_llm(temperature: float = 0.0):
    if LLM_PROVIDER == "ollama":
        # Local model via Ollama — no API key required.
        from langchain_ollama import ChatOllama

        return ChatOllama(
            model=OLLAMA_MODEL,
            temperature=temperature,
            base_url=OLLAMA_BASE_URL,
        )

    if LLM_PROVIDER == "anthropic":
        # Anthropic Claude via the Messages API.
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=ANTHROPIC_CHAT_MODEL,
            temperature=temperature,
            max_tokens=ANTHROPIC_MAX_TOKENS,
            api_key=require_anthropic_key(),
            timeout=60,
            max_retries=2,
        )

    # xAI's Grok API is OpenAI-compatible, so we reuse ChatOpenAI with xAI's base URL.
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=XAI_CHAT_MODEL,
        temperature=temperature,
        api_key=require_xai_key(),
        base_url=XAI_BASE_URL,
    )


@lru_cache(maxsize=1)
def _encoding():
    import tiktoken

    # cl100k_base covers gpt-4o / gpt-4o-mini tokenisation well enough for budgeting.
    return tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_encoding().encode(text))


def truncate_to_tokens(text: str, max_tokens: int) -> str:
    enc = _encoding()
    tokens = enc.encode(text)
    if len(tokens) <= max_tokens:
        return text
    return enc.decode(tokens[:max_tokens])
