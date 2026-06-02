"""Split extracted page text into overlapping, token-sized chunks.

Chunking happens per page so each chunk keeps an accurate page number for
citations. Sizing is measured in tokens (via tiktoken) per plan.txt's guidance
of ~500-1000 token chunks with 100-200 token overlap.
"""
from __future__ import annotations

from typing import List, Tuple

from langchain_text_splitters import RecursiveCharacterTextSplitter

from .config import CHUNK_OVERLAP, CHUNK_SIZE

Page = Tuple[int, str]


class Chunk:
    __slots__ = ("text", "page", "index")

    def __init__(self, text: str, page: int, index: int):
        self.text = text
        self.page = page
        self.index = index


def chunk_pages(pages: List[Page]) -> List[Chunk]:
    splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks: List[Chunk] = []
    running_index = 0
    for page_number, text in pages:
        for piece in splitter.split_text(text):
            piece = piece.strip()
            if not piece:
                continue
            chunks.append(Chunk(text=piece, page=page_number, index=running_index))
            running_index += 1
    return chunks
