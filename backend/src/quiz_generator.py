"""Quiz generation (plan.txt step 10).

Generates multiple-choice questions grounded in the document's content. Each
question aims for four options, a correct-answer index, and an explanation.

Local models don't always honour "exactly four options", so we parse the
model output leniently (no hard schema validators that would reject the whole
quiz) and then repair each question in Python, retrying once if nothing usable
comes back.
"""
from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field

from .llm import STRUCTURED_OUTPUT_METHOD, get_chat_llm, truncate_to_tokens
from .vectorstore import get_document_chunks

# Token budget of document content fed to the model when generating a quiz.
QUIZ_CONTEXT_TOKEN_BUDGET = 8_000

DIFFICULTY_GUIDANCE = {
    "easy": "Test basic recall of definitions and facts. Keep questions straightforward.",
    "medium": "Test understanding and the ability to connect concepts.",
    "hard": "Test deep understanding, application, and reasoning about the material.",
}


class QuizQuestion(BaseModel):
    question: str = Field(description="The question text")
    options: List[str] = Field(description="Exactly four answer options")
    correct: int = Field(description="0-based index of the correct option (0-3)")
    explanation: str = Field(description="Why the correct answer is right")


class Quiz(BaseModel):
    questions: List[QuizQuestion] = Field(description="The generated quiz questions")


_SYSTEM = (
    "You are a study assistant that writes quizzes. Generate questions ONLY from "
    "the provided study material. Every question MUST have EXACTLY four options: "
    "one clearly correct answer and three plausible distractors. Test "
    "understanding rather than trivia. Do not reference 'the text' or 'the "
    "passage' in questions."
)

_FILLERS = ["None of the above", "All of the above", "Not enough information"]


def _repair_question(q: QuizQuestion) -> QuizQuestion | None:
    """Coerce a model question into a clean 4-option item, or drop it."""
    options = [o.strip() for o in (q.options or []) if o and o.strip()]
    if len(options) < 2 or not q.question.strip():
        return None  # unsalvageable

    correct = q.correct if isinstance(q.correct, int) else 0

    if len(options) > 4:
        # Keep the correct option plus the first distractors, total 4.
        correct = max(0, min(correct, len(options) - 1))
        correct_opt = options[correct]
        kept = [o for i, o in enumerate(options) if i != correct][:3]
        options = [correct_opt, *kept]
        correct = 0
    elif len(options) < 4:
        # Pad with generic distractors (de-duplicated) up to 4.
        for filler in _FILLERS:
            if len(options) >= 4:
                break
            if filler not in options:
                options.append(filler)

    correct = max(0, min(correct, len(options) - 1))
    return QuizQuestion(
        question=q.question.strip(),
        options=options[:4],
        correct=correct,
        explanation=(q.explanation or "").strip(),
    )


def _clean(quiz: Quiz, count: int) -> Quiz:
    repaired = [r for q in quiz.questions if (r := _repair_question(q)) is not None]
    return Quiz(questions=repaired[:count])


def generate_quiz(doc_id: str, difficulty: str = "medium", count: int = 5) -> Quiz:
    difficulty = difficulty if difficulty in DIFFICULTY_GUIDANCE else "medium"
    count = max(1, min(count, 10))

    chunks = get_document_chunks(doc_id)
    if not chunks:
        raise ValueError("This document has no indexed content to quiz on.")

    context = truncate_to_tokens(
        "\n\n".join(text for _page, text in chunks), QUIZ_CONTEXT_TOKEN_BUDGET
    )

    structured_llm = get_chat_llm(temperature=0.4).with_structured_output(
        Quiz, method=STRUCTURED_OUTPUT_METHOD
    )
    messages = [
        ("system", _SYSTEM),
        (
            "human",
            f"Difficulty: {difficulty}. {DIFFICULTY_GUIDANCE[difficulty]}\n\n"
            f"Generate exactly {count} multiple-choice questions, each with "
            f"exactly 4 options, from this material:\n\n{context}",
        ),
    ]

    # Retry once — local models occasionally emit a malformed batch.
    last_error: Exception | None = None
    for _ in range(2):
        try:
            quiz = _clean(structured_llm.invoke(messages), count)
            if quiz.questions:
                return quiz
        except Exception as exc:  # noqa: BLE001 - retry, then surface a clean message
            last_error = exc

    raise ValueError(
        "The model couldn't produce a valid quiz from this document. "
        "Please try again." + (f" ({last_error})" if last_error else "")
    )
