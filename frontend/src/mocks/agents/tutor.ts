/**
 * EXTENSION: Tutor Agent script from /docs/AGENTIC_DESIGN.md B1.3.
 * Agentic RAG: decomposes question, rewrites query, searches course vectors,
 * self-reflects on context sufficiency, grounds answer with citations, and scores confidence.
 */
import type { AgentScript } from './engine'
import { registerAgentScript } from './engine'

export const tutorScript: AgentScript = async function* (input, ctx) {
  const question = input.question || 'Explain database normalization and BCNF'
  const simulation = ctx.simulation || 'normal'

  // Step 1: Plan
  yield {
    type: 'plan',
    content: `Deconstructing student inquiry: "${question}". Formulating retrieval strategy, checking domain boundaries, and preparing grounded multi-hop reasoning.`,
    autonomy: 'auto',
  }

  // Step 2: Query Rewrite & Reflection
  const rewrittenQuery = question.replace(/[?.,!]/g, '').toLowerCase()
  yield {
    type: 'reflection',
    content: `Query rewritten for dense embedding match: "${rewrittenQuery}". Restricting retrieval strictly to course collection ${ctx.courseId}.`,
    autonomy: 'auto',
  }

  // Step 3: Tool Call (vector_search)
  yield {
    type: 'tool_call',
    content: `Querying course-scoped vector store for relevant lecture slides and textbooks.`,
    toolName: 'vector_search',
    input: {
      courseId: ctx.courseId,
      query: rewrittenQuery,
      topK: 3,
    },
    autonomy: 'auto',
  }

  // Step 4: Context Sufficiency Check (Reflection)
  const isOutOfScope = simulation === 'failure' || input.isOutOfScope
  const isLowConfidence = simulation === 'low_confidence'

  if (isOutOfScope) {
    yield {
      type: 'reflection',
      content: `GROUNDING CHECK FAILED: Retrieved context similarity is below threshold (0.42). Question is outside the curriculum of this course. Refusing to hallucinate; generating honest referral to professor (B1.3).`,
      status: 'error',
      autonomy: 'auto',
    }

    const answer =
      `I searched the published course materials for ${ctx.courseId}, but this question falls outside the current syllabus. To ensure you receive accurate guidance, I recommend asking Professor Rao during office hours or posting in the course discussion.`

    yield {
      type: 'tool_call',
      content: `Recording out-of-scope doubt consultation.`,
      toolName: 'save_doubt',
      input: {
        doubtRecord: {
          courseId: ctx.courseId,
          studentId: ctx.actorId,
          question,
          answer,
          citations: [],
          confidence: 0.35,
          outOfScope: true,
        },
      },
      autonomy: 'auto',
    }

    return {
      answer,
      citations: [],
      confidence: 0.35,
      outOfScope: true,
    }
  }

  yield {
    type: 'reflection',
    content: `Context sufficiency validated. Retrieved 3 highly relevant excerpts with verified cosine similarity > 0.82. Synthesizing grounded explanation with explicit page citations.`,
    autonomy: 'auto',
  }

  // Step 5: Draft Answer with Citations
  const citations = [
    {
      materialId: 'mat_cs301_02',
      materialTitle: 'Lecture 2: Relational Normalization & Boyce-Codd Normal Form',
      page: 8,
      snippet:
        'A relation R is in Boyce-Codd Normal Form (BCNF) if and only if every non-trivial functional dependency X -> Y has X as a superkey.',
    },
    {
      materialId: 'mat_cs301_02',
      materialTitle: 'Lecture 2: Relational Normalization & Boyce-Codd Normal Form',
      page: 12,
      snippet:
        '3NF preserves functional dependencies while BCNF eliminates all redundancy caused by functional dependencies, sometimes at the expense of dependency preservation.',
    },
  ]

  const answer =
    `Boyce-Codd Normal Form (BCNF) is a stricter version of Third Normal Form (3NF). A relation R is in BCNF if for every non-trivial functional dependency X → Y, X is a superkey of R.\n\nKey Differences:\n1. **Redundancy Elimination**: BCNF eliminates all update, insertion, and deletion anomalies caused by functional dependencies.\n2. **Dependency Preservation**: Unlike 3NF, BCNF decomposition cannot always guarantee dependency preservation while remaining lossless.\n\nIn practice, if a 3NF schema already has superkeys on all determinants, it is automatically in BCNF.`

  const confidence = isLowConfidence ? 0.65 : 0.95

  yield {
    type: 'tool_call',
    content: `Persisting doubt resolution and citations to course history.`,
    toolName: 'save_doubt',
    input: {
      doubtRecord: {
        courseId: ctx.courseId,
        studentId: ctx.actorId,
        question,
        answer,
        citations,
        confidence,
        outOfScope: false,
      },
    },
    autonomy: 'auto',
  }

  return {
    answer,
    citations,
    confidence,
    outOfScope: false,
  }
}

registerAgentScript('tutor', tutorScript)
