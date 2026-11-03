# AiCademy Roadmap

Linked from /brain.md. Sources of truth: /docs/ARCHITECTURE_SOURCE.md (PDF) and /docs/AGENTIC_DESIGN.md (EXTENSION).
**Phase 0 (current)** is the frontend prototype with simulated agents (Milestones 0–8, tracked in brain.md "Current Status").
Each phase below starts **only** when the project owner says so.

---

## Phase 1: Express API and MongoDB
**Build**
- `/backend`: Node.js + Express with an MVC layout (routes → controllers → services → models).
- Middleware: helmet, cors, JSON parsing, request logging with request IDs, express-rate-limit, JWT auth, role and ownership guards, Multer uploads (type and size limits, sanitized filenames).
- Auth: bcryptjs password hashing and JWT access tokens (`/api/auth/register`, `/login`, `/me`).
- Mongoose models for every type in Section 4 (User, Course, Material, Assignment, Submission, Doubt, Announcement, Comment, Leaderboard, ChatClearMarker), plus the EXTENSION models AgentRun, AgentStep, ApprovalRequest, AgentMemory, AgentPolicy and Notification.
- Every Section 5 route, plus the EXTENSION routes listed in brain.md section 10. Match the payload shapes in `frontend/src/types/*` exactly.
- Port the mock handler logic (`frontend/src/mocks/handlers/*`) to controllers. Remove the matching `TODO(backend)` comments.
- Swap the frontend over: `VITE_USE_MOCKS=false`, `VITE_API_BASE_URL=http://localhost:<port>/api`.

**Update in brain.md when this phase starts:** Current Status, Next Steps, Scope Rules, Tech Stack and How to Run (backend commands, env names such as `MONGODB_URI`, `JWT_SECRET`, `UPLOAD_DIR`), Architecture Map (add /backend), Data Models and Routes Summary (mock → real), Known Issues, Decision Log.

## Phase 2: FastAPI AI service (PDF endpoints)
**Build**
- `/ai-service`: FastAPI with the internal routes `/ingest-material`, `/evaluate-assignment`, `/ask-doubt-rag`, `/score-doubt-quality`.
- PDF text extraction (for example pypdf or pdfplumber), OpenAI or Groq clients behind a provider interface, and structured outputs validated with Pydantic.
- Deterministic heuristic fallbacks when the model is unavailable (PDF Section 3.3).
- Service-to-service auth: an internal shared token, never exposed to the browser. Timeouts and retries on the Express side.

**Update in brain.md:** Scope Rules, Tech Stack (Python version, env names `OPENAI_API_KEY`, `GROQ_API_KEY`, `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`), Architecture Map, Routes Summary, Known Issues.

## Phase 3: ChromaDB and real RAG
**Build**
- A ChromaDB collection (or metadata filter) per course. Every vector record carries `courseId` and `materialId`. Every query is filtered by courseId.
- Chunking strategy (around 800 tokens with overlap, tuned per material type), page metadata for citations, topic tagging.
- Clean up stale chunks on reindex and delete. Make ingestion idempotent (keyed by materialId and content hash).

**Update in brain.md:** Tech Stack (`CHROMA_URL`), Architecture Map, Mock Agent Engine Explained (mark `vector_search` and `chunk_and_embed` as real), Known Issues.

## Phase 4: Real agent runtime
**Framework recommendation (B8): LangGraph**, inside the FastAPI service, with OpenAI or Groq tool-calling and structured outputs.
- *Why:* each AiCademy agent is already a small state machine (plan → tool → observe → reflect → final). Approvals need **pause and resume** (`waiting_for_approval`). LangGraph provides explicit graphs, built-in human-in-the-loop interrupts, checkpointed durable state (resume after an approval or a crash), step-level streaming for traces, and recursion and step limits.
- *Rejected: a custom loop.* It's simpler at first, but we would have to rebuild checkpointing, interrupt and resume, and streaming ourselves. Reconsider it only if the LangGraph dependency becomes a burden.
- *Rejected: CrewAI and AutoGen.* They're aimed at conversational multi-agent setups, give less deterministic control flow, and are harder to audit for grading.

**Build**
- Port the Orchestrator and the 6 specialist agents from `frontend/src/mocks/agents/*` (the scripts are the behavioral spec), and the 13-tool registry with Pydantic schemas and permission scopes.
- Durable run state: AgentRun and AgentStep in MongoDB, written through Express or by the AI service with internal credentials. A background job queue (for example BullMQ on Redis, or arq or Celery on the Python side) for the B6 event triggers.
- Approvals stored in MongoDB. The `/api/agents/approvals/:id/decide` route resumes the LangGraph checkpoint.
- Stream traces over SSE (`GET /api/agents/runs/:runId/stream`), replacing the polling inside `useRunStream`. Polling stays as a fallback.
- Internal routes `/agents/orchestrate`, `/agents/tutor`, `/agents/grade`, `/agents/ingest`, `/agents/insights`, `/agents/coach`. Remove the matching `TODO(agent-runtime)` comments.

**Update in brain.md:** Scope Rules, Architecture Map, Mock Agent Engine Explained (rewrite as "Agent Runtime"), Routes Summary, Decision Log (framework confirmation), Known Issues.

## Phase 5: Eval harness, guardrails and observability (B7)
**Build**
- A golden set: questions per course with expected citations, plus submissions with professor scores.
- Metrics: citation accuracy, grading agreement (for example within ±10% or Cohen's kappa), hallucination rate, latency, cost. Run in CI on every prompt or agent change.
- Guardrails: grounding checker, prompt-injection classifier and delimiting, PII minimization before model calls, per-run step, token and retry limits, daily budget enforcement.
- Observability: request IDs passed browser → Express → FastAPI, structured logs, metrics (success, approval, override rate, cost per course), audit events for grade changes.

**Update in brain.md:** Tech Stack (eval commands), Conventions, Known Issues, Gotchas.

## Phase 6: Docker Compose and Section 6 hardening
**Build**
- `docker-compose.yml` with the services frontend, backend, ai-service, mongodb, chromadb, and redis if a queue is used. Health and readiness checks.
- Section 6 risks:
  - **Security:** JWT validation, ownership checks, upload limits, secrets kept out of images.
  - **Privacy:** retention policies, PII handling, memory deletion honored in the backend.
  - **AI reliability:** citations, schema validation, confidence scores, professor review.
  - **Retrieval quality:** chunk tuning, stale-index cleanup.
  - **Scalability:** queues, caching, async status updates.
  - **File storage:** object storage (S3-compatible) and malware scanning.
  - **Resilience:** timeouts, retries, graceful degradation.
  - **Data consistency:** idempotent updates for submissions, indexing, leaderboard and AI results.
  - **Observability:** centralized logs.
  - **Cost management:** token limits, model selection, prompt-size limits.

**Update in brain.md:** Tech Stack and How to Run (compose commands), Architecture Map, Known Issues, Gotchas.
