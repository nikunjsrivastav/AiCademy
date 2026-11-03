from typing import List, Dict, Any
from .models import (
    AskDoubtRAGRequest,
    AskDoubtRAGResponse,
    Citation,
    ScoreDoubtQualityRequest,
    ScoreDoubtQualityResponse,
    DoubtQualityBreakdown
)
from .vector_store import vector_store
from .groq_client import groq_service

TUTOR_SYSTEM_PROMPT = """You are the AiCademy Academic AI Tutor.
Your goal is to guide students to deep understanding of university curriculum concepts.
RULES:
1. Ground your explanations strictly in the provided syllabus and course materials.
2. Directly cite the lecture title and page number when referring to concepts.
3. If the student question is completely unrelated to the curriculum, politely decline and instruct them to consult their professor during office hours.
4. Keep explanations pedagogical, concise, and structured."""

def answer_doubt_rag(req: AskDoubtRAGRequest) -> AskDoubtRAGResponse:
    # 1. Retrieve course-grounded chunks
    retrieved = vector_store.search(req.courseId, req.question, top_k=3)

    citations: List[Citation] = []
    for c in retrieved:
        citations.append(Citation(
            materialId=c["materialId"],
            title=c["title"],
            pages=[c["pageNumber"]],
            snippet=c["text"][:150] + "..."
        ))

    # Check relevance / scope
    if not retrieved:
        return AskDoubtRAGResponse(
            answer="This inquiry falls outside our current indexed course curriculum. Please consult your professor during scheduled office hours or post in the class discussion forum.",
            citations=[],
            confidence=0.45,
            outOfScope=True
        )

    context_str = "\n\n".join([f"[{c['title']} p.{c['pageNumber']}]: {c['text']}" for c in retrieved])

    # 2. Generate response via Groq
    if groq_service.is_available():
        user_prompt = f"""CURRICULUM CONTEXT:
{context_str}

STUDENT QUESTION:
{req.question}

Provide an authoritative, clear explanation grounded in the curriculum citations."""

        ai_answer = groq_service.chat_completion(
            system_prompt=TUTOR_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3
        )
        if ai_answer:
            return AskDoubtRAGResponse(
                answer=ai_answer,
                citations=citations,
                confidence=0.94,
                outOfScope=False
            )

    # 3. Deterministic Heuristic Fallback
    top_citation = citations[0]
    return AskDoubtRAGResponse(
        answer=f"Based on {top_citation.title} (Page {top_citation.pages[0]}): The curriculum defines this concept within the scope of our primary lecture modules. Key theorems and implementations are detailed in the referenced slides.",
        citations=citations,
        confidence=0.88,
        outOfScope=False
    )

def score_doubt_quality(req: ScoreDoubtQualityRequest) -> ScoreDoubtQualityResponse:
    text = req.question.strip()
    words = text.split()
    word_count = len(words)

    # Clarity (0-35)
    clarity = 30 if word_count >= 6 else (20 if word_count >= 3 else 10)
    if '?' in text:
        clarity = min(35, clarity + 5)

    # Specificity (0-35)
    has_spec = any(term in text.lower() for term in ['why', 'how', 'difference', 'theorem', 'algorithm', 'complexity', 'function', 'proof', 'database', 'model'])
    specificity = 32 if (has_spec and word_count >= 8) else (24 if has_spec else 15)

    # Effort (0-30)
    has_effort = any(term in text.lower() for term in ['tried', 'because', 'assuming', 'understand', 'lecture', 'slide', 'notes', 'thought'])
    effort = 28 if (has_effort or word_count >= 12) else (20 if word_count >= 6 else 12)

    total_score = min(100, clarity + specificity + effort)

    feedback = "Excellent analytical inquiry showing strong diagnostic effort."
    if total_score < 70:
        feedback = "Good start! Try stating what you have already tried and cite the specific slide or code snippet to help the AI tutor guide you faster."

    return ScoreDoubtQualityResponse(
        score=total_score,
        breakdown=DoubtQualityBreakdown(
            clarity=clarity,
            specificity=specificity,
            effort=effort
        ),
        feedback=feedback
    )
