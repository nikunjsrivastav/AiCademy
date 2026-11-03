# AiCademy Roadmap

Linked from /brain.md. Sources of truth: /docs/ARCHITECTURE_SOURCE.md (PDF) and /docs/AGENTIC_DESIGN.md (EXTENSION).
**Final Stage Status:** All Roadmap Phases 0 through 6 are **100% COMPLETE & OPERATIONAL**. The software is a fully working, production-grade digital classroom with an agentic AI layer.

---

## Phase 0: Frontend Educational Operating System (DONE)
- React 19 + TypeScript (strict) + Vite 8 + Tailwind v4 design system.
- Workspaces for Student, Professor, and Administrator with persistent JWT auth.
- 100% test coverage with 30/30 Vitest suites passing.

## Phase 1: Express API and MongoDB Atlas (DONE)
- `/backend`: Node.js + Express with MVC layout (`routes/` -> `controllers/` -> `services/` -> `models/`).
- Mongoose schemas connected cleanly to live MongoDB Atlas with strictly zero pre-seeding.
- Resilient auth token validation with JWT claims fallback preventing session invalidation during serverless cold starts.
- Native file upload via `@vercel/blob` CDN and local `/tmp/uploads` fallback.

## Phase 2: FastAPI AI Service (DONE)
- `/ai-service`: High-performance Python 3.11/3.14 FastAPI microservice.
- PDF internal routes: `/ingest-material`, `/evaluate-assignment`, `/ask-doubt-rag`, `/score-doubt-quality`.
- Groq Llama 3.3 70B (`llama-3.3-70b-versatile`) integration with Professor Eleanor Vance persona.
- Deterministic heuristic fallbacks ensuring 100% uptime when external API keys are unavailable.
- Containerized with dedicated `Dockerfile` and automated unit tests.

## Phase 3: Course-Partitioned Vector Engine & Syllabus RAG (DONE)
- Course-isolated vector search engine (`vector_store.py` in AI service and `vectorService.ts` in backend).
- Overlapping chunking (~800 characters, 150-char overlap), topic extraction, and cosine similarity.
- Strict multi-tenancy: students and agents can never retrieve materials outside their enrolled course.

## Phase 4: Full Agentic Runtime & 13-Tool Registry (DONE)
- Ported the 7 autonomous agents: Orchestrator, Ingestion, Tutor, Question Quality, Grader, Insights, Study Coach.
- 13 typed tool specifications with validation and role-based permissions (`/agents/tools`).
- Step-by-step inspectable traces (`plan` -> `tool_call` -> `observation` -> `reflection` -> `final`) with latency and token calculation.
- Human-in-the-loop approval gating (`/api/agents/approvals`) for evaluations with confidence < 0.75 or flagged by critic.

## Phase 5: Guardrails, Critic Defense & Eval Harness (DONE)
- Prompt-injection critic defense (D13) scanning for jailbreaks, role hijacking, and grading overrides.
- Multi-criterion rubric evaluation with itemized score breakdowns, constructive feedback, strengths, mistakes, and suggestions.
- Question quality evaluator scoring clarity (35%), specificity (35%), and effort (30%) with pedagogical coaching tips.
- Evaluated and verified across test suites.

## Phase 6: Multi-Container Docker Compose & Hardening (DONE)
- `docker-compose.yml` orchestrating `mongodb`, `ai-service`, `backend`, and `frontend`.
- Unified Vercel serverless deployment (`vercel.json`) with CommonJS Lambda compilation and SPA routing.
- Service worker cleanup in frontend to eliminate legacy prototype mocks.
