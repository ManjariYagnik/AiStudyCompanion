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
    "the provided study material. Strict rules:\n"
    "- Every question has EXACTLY four options: one clearly correct answer and "
    "three plausible but wrong distractors.\n"
    "- NEVER use 'All of the above', 'None of the above', 'Both', or similar "
    "meta-options. Every option must be a concrete, standalone answer.\n"
    "- Exactly ONE option is correct; set 'correct' to its 0-based index.\n"
    "- The 'explanation' MUST state and justify that exact correct option, and "
    "must be consistent with the option you marked correct.\n"
    "- Test understanding, not trivia. Don't reference 'the text' or 'the passage'."
)

# Meta-options the model must not use; if one is marked correct, the question is
# unreliable (its explanation rarely matches), so we drop it.
_META = ("all of the above", "none of the above", "both of the above", "all of these", "none of these")


def _repair_question(q: QuizQuestion) -> QuizQuestion | None:
    """Coerce a model question into a clean 4-option item, or drop it."""
    options = [o.strip() for o in (q.options or []) if o and o.strip()]
    # Need a real 4-option question; don't fabricate options (that caused
    # explanation/answer mismatches). Drop anything that isn't clean.
    if len(options) < 4 or not q.question.strip():
        return None

    correct = q.correct if isinstance(q.correct, int) else 0

    if len(options) > 4:
        # Keep the correct option plus the first distractors, total 4.
        correct = max(0, min(correct, len(options) - 1))
        correct_opt = options[correct]
        kept = [o for i, o in enumerate(options) if i != correct][:3]
        options = [correct_opt, *kept]
        correct = 0

    options = options[:4]
    correct = max(0, min(correct, len(options) - 1))

    # Drop questions whose marked-correct answer is a meta-option — the model's
    # explanation almost never matches these.
    if options[correct].strip().lower().rstrip(".") in _META:
        return None

    return QuizQuestion(
        question=q.question.strip(),
        options=options,
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

    # Lower temperature keeps the marked answer consistent with the explanation.
    structured_llm = get_chat_llm(temperature=0.2).with_structured_output(
        Quiz, method=STRUCTURED_OUTPUT_METHOD
    )
    # Over-request a little so dropped (malformed/meta) questions don't leave
    # the quiz short; _clean trims back down to `count`.
    ask_for = min(count + 2, 12)
    messages = [
        ("system", _SYSTEM),
        (
            "human",
            f"Difficulty: {difficulty}. {DIFFICULTY_GUIDANCE[difficulty]}\n\n"
            f"Generate {ask_for} multiple-choice questions, each with exactly 4 "
            f"concrete options (no 'all/none of the above'), from this material. "
            f"Make sure each explanation matches the option you mark correct."
            f"\n\n{context}",
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
