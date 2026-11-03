# AGENTIC_DESIGN.md

> Verbatim copy of "PART B: THE AGENTIC AI DESIGN (EXTENSION TO THE PDF)" as supplied by the project owner on 2026-10-05.
> Everything in this file is an EXTENSION of /docs/ARCHITECTURE_SOURCE.md. Do not edit the content below. Record deltas and decisions in /brain.md instead.

---

The PDF describes AI endpoints (/ingest-material, /evaluate-assignment, /ask-doubt-rag, /score-doubt-quality). In this project we upgrade them from single-shot model calls into AGENTS. An agent here means: it receives a goal, makes a plan, calls tools, observes the results, reflects or retries, and produces a validated final output, with every step recorded in a trace. Anything beyond the PDF is an extension; label it clearly as "EXTENSION" in code, docs, and the UI so it is never confused with the original contract.

B1. AGENT ROSTER
1. Orchestrator Agent: receives events and requests (a new submission, a new material, a student question, a weekly schedule tick), decides which specialist agent(s) to run, in what order, and merges results. It enforces the guardrails and autonomy levels below.
2. Ingestion Agent: when a material is uploaded or reindexed, it plans the work: detect file type, extract text, choose a chunk size, tag chunks with topics, embed into the course-scoped vector collection, verify index quality (a retrieval self-test), and report an indexing status. It retries on failure and cleans stale chunks.
3. Tutor Agent (doubt solver, agentic RAG): breaks a student question down, decides whether it needs retrieval, rewrites the query, retrieves from the course-scoped store, checks whether the retrieved context is sufficient (and re-retrieves if not), drafts an answer with citations (material name and page), self-verifies that each claim is grounded, and attaches a confidence score. If the answer is out of scope or low-confidence, it says so honestly and suggests asking the professor instead of guessing.
4. Question Quality Agent: scores each student question (clarity, specificity, effort shown) and gives a short coaching tip. The score feeds the leaderboard's doubt-related component.
5. Grader Agent: evaluates a submission against the rubric criterion by criterion: extract the text, plan the evaluation per criterion, gather evidence from the submission, score each criterion, write feedback, list mistakes and suggestions, and compute overall confidence. Low-confidence or borderline results are routed to professor review. A critic step double-checks the scores for rubric consistency before they are saved.
6. Insights Agent (teaching copilot): periodically analyzes learning data (score distributions, frequently asked doubts, weak topics) and produces teaching suggestions for the professor (for example, "40% of doubts this week are about normalization; consider a revision session"). It can draft an announcement for the professor to approve.
7. Study Coach Agent (student-facing, proactive): looks at a student's progress and deadlines, then proposes a personalized study plan and nudges (for example, "Assignment 2 is due in 2 days and your weak topic is joins; here is a 3-step plan with links to the relevant materials").

B2. TOOL REGISTRY (agents act only through these tools)
Define a typed tool registry with a name, description, input schema, output schema, and permission scope for each tool:
- extract_text(file)
- chunk_and_embed(materialId, chunkSize)
- vector_search(courseId, query, topK) (always filtered by courseId)
- get_rubric(assignmentId)
- get_submission(submissionId)
- get_course_materials(courseId)
- get_student_progress(studentId, courseId)
- get_course_analytics(courseId)
- save_evaluation(submissionId, result)
- save_doubt(doubtRecord)
- draft_announcement(courseId, text)
- create_notification(userId, message)
- request_human_approval(runId, summary, proposedAction)
Rules: tools are scoped to the acting user's permissions and course; an agent can never read another course's data; tool inputs and outputs are schema-validated; every tool call is logged.

B3. AUTONOMY LEVELS AND HUMAN-IN-THE-LOOP
- Auto: low-risk actions (indexing, answering a doubt with high confidence and citations, scoring question quality, sending a notification).
- Needs approval: anything that affects grades, posts to a class, or is low-confidence (final grades, auto-drafted announcements, grader results with confidence below a threshold).
- Never allowed: agents cannot finalize grades without a professor accepting or overriding them, cannot delete data, and cannot access out-of-course data.
Show the autonomy level on every agent action in the UI.

B4. AGENT RUNTIME MODEL (EXTENSION DATA MODELS)
- AgentRun: id, agent name, trigger (event type or user action), status (queued, running, waiting_for_approval, succeeded, failed, cancelled), startedAt, endedAt, courseId, actor, token and cost estimate, final output.
- AgentStep: runId, index, type (plan, tool_call, observation, reflection, final), content, tool name, input, output, latency, status.
- ApprovalRequest: runId, summary, proposedAction, status (pending, approved, rejected, edited), reviewer, decidedAt, note.
- AgentMemory: scope (student, course, or professor), key, value, updatedAt. Used for things like a student's weak topics and a professor's preferred feedback tone. Memory is scoped, inspectable, and deletable.
- AgentPolicy: per-course settings (which agents are enabled, auto-publish toggle, confidence threshold, daily token budget).

B5. EXTENSION API ROUTES (all under /api, following the PDF's conventions; prototype serves them from the mock layer)
- POST /api/agents/runs: start a run (usually triggered internally by events, also manually for demos).
- GET /api/agents/runs?courseId=...: list runs.
- GET /api/agents/runs/:runId: get a run with its steps (the trace).
- POST /api/agents/runs/:runId/cancel
- GET /api/agents/approvals?courseId=...: list pending approvals.
- POST /api/agents/approvals/:approvalId/decide: approve, reject, or edit.
- GET and PUT /api/agents/policy/:courseId
- GET /api/agents/memory/:courseId and DELETE /api/agents/memory/:memoryId
- GET /api/agents/study-plan/:courseId: Study Coach output for the current student.
- GET /api/agents/insights/:courseId: Insights Agent output for the professor.
Future internal FastAPI routes (EXTENSION, not for the browser): /agents/orchestrate, /agents/tutor, /agents/grade, /agents/ingest, /agents/insights, /agents/coach.

B6. EVENT TRIGGERS
material.uploaded -> Ingestion Agent; submission.created -> Grader Agent (then approval if needed); doubt.asked -> Tutor Agent then Question Quality Agent; weekly.tick -> Insights Agent and Study Coach Agent; deadline.approaching -> Study Coach Agent. The Orchestrator handles routing.

B7. AGENT SAFETY, EVALUATION, AND OBSERVABILITY
- Guardrails: schema-validated outputs, grounding checks (no uncited claims in tutor answers), prompt-injection resistance (treat uploaded material and student text as untrusted data, never as instructions), PII minimization, per-run step limit and token budget, loop and retry limits, and graceful fallback to deterministic heuristics when the model is unavailable (as in PDF Section 3.3).
- Evaluation: plan an eval harness with a golden set of questions with expected citations, graded submissions compared with professor scores, and metrics for citation accuracy, grading agreement, hallucination rate, latency, and cost.
- Observability: every run has a request ID and a full step trace, with metrics for success rate, approval rate, override rate, and cost per course.

B8. SUGGESTED AGENT FRAMEWORK FOR THE LATER BACKEND PHASE
Implement agents in the FastAPI service using a graph or state-machine style orchestration (for example LangGraph) or a lightweight custom loop, with the model accessed through OpenAI or Groq tool-calling and structured outputs. Recommend one and justify it in ROADMAP.md. For now, only the frontend and mocked agent behavior are required.
