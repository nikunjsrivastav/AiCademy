# brain.md: AiCademy Project Memory

## 1. Read This First
This file is the single handoff document for AiCademy; a new agent with zero memory must be able to continue from it alone.
Reading order: this file → /docs/ARCHITECTURE_SOURCE.md → /docs/AGENTIC_DESIGN.md → /ROADMAP.md → the code under /frontend.
Keep this file current: a stale brain.md is a bug.

## 2. Project Identity
AiCademy is an AI-enabled digital classroom platform for university courses.
Users: **student** (enrolls in courses, reads materials, submits assignments, asks course questions, tracks progress), **professor** (owns courses, uploads materials, creates assignments with rubrics, reviews grades, posts announcements, reads analytics, approves agent actions), **administrator** (read-only platform overview).
Pitch: AiCademy combines classroom management with an **agentic AI** layer. Instead of single-shot chatbot calls, autonomous tool-using agents (Orchestrator, Ingestion, Tutor, Question Quality, Grader, Insights, Study Coach) plan, call typed tools, observe results, reflect or retry, and ask a professor for approval before anything that affects grades or posts to a class. Every agent step is recorded in an inspectable trace.

## 3. Source of Truth and Precedence
- [/docs/ARCHITECTURE_SOURCE.md](docs/ARCHITECTURE_SOURCE.md): verbatim original PDF architecture proposal (Part A).
- [/docs/AGENTIC_DESIGN.md](docs/AGENTIC_DESIGN.md): verbatim agentic design (Part B). Everything in it is an EXTENSION.
- Precedence: the original PDF design wins over everything else. All agentic and other additions are labeled **EXTENSION** in code, docs and UI.
- If code and docs disagree, record it in section 13 (Known Issues). Do not silently pick one.
- Do not copy these docs into brain.md; record only deltas and decisions here.

## 4. Current Status
Last updated: 2026-11-01.
Phase: **Phase 1: Production Readiness & Full-Stack Deployment.** All Milestones 0 through 8 complete, full Express API delivered in `/backend`, and frontend transitioned to clean production mode.

| # | Milestone | Status |
|---|---|---|
| 0 | Docs setup: /docs files, brain.md, AGENTS.md, ROADMAP.md, /backend and /ai-service placeholders | done |
| 1 | Scaffold (Vite + React + TypeScript), Tailwind v4 design system, app shell, MSW, mock JWT auth, role guards | done |
| 2 | Course and material flows (create, enroll, materials, upload, indexing badge, reindex) | done |
| 3 | Mock agent engine, tool registry, Orchestrator, Ingestion Agent, Agent Trace Viewer | done |
| 4 | Assignments, rubric builder, submissions, Grader Agent flow, score override | done |
| 5 | Tutor chat, Question Quality Agent, Approval Queue | done |
| 6 | Announcements and comments, leaderboard, analytics, Insights panel, Study Coach, student progress | done |
| 7 | Agent Control Center, Memory viewer, Runs dashboard, event simulator, admin overview | done |
| 8 | Extras and polish (command palette, notifications, accessibility, README demo script, tests) | done |
| 9 | Production Express Backend API, Docker Compose, Demo Removal, and UI consistency | done |

What works right now: Complete, end-to-end Phase 0 educational operating system in `/frontend` running on Vite 8 + React 19 + TypeScript (strict) + Tailwind v4.
1. **Core & Workspaces**: Role-gated workspaces for Student, Professor, and Administrator with persistent JWT auth, DemoRoleSwitcher (11 seed personas), dynamic 12-preset Accent Color engine (`AccentContext`), pre-paint contrast engine, and 4px baseline responsive layout (`PageContainer`, `AppShell` with scroll-locked sidebar, zero mobile overflow).
2. **Courses & Materials (M2)**: 3 seeded university courses (CS301, CS220, AI410); enrollment code generation and 6-char lookup; Material Manager with format/size validation (PDF, DOCX, PPTX, TXT, MD up to 20MB per D10), vector-indexing status badges, and reindex trigger.
3. **Simulated Agent Engine (M3)**: Deterministic async generator engine (`engine.ts`), 13 typed tools with Zod validation and course scope isolation (`registry.ts`), Orchestrator agent, Ingestion agent, streaming step trace viewer (`AgentTraceViewer.tsx`) with latency/token breakdown, and runs dashboard (`AgentRunsList.tsx`).
4. **Assignments & Grading (M4)**: Rubric builder with multi-criterion scoring (D2), student submission upload with format/size validation (PDF, DOCX, TXT, ZIP up to 10MB per D10), Grader Agent with prompt-injection critic defense (D13), human review threshold (D12), and professor score override preserving AI evaluation (D9).
5. **AI Tutor & Approvals (M5)**: Syllabus RAG Tutor chat with source grounding and honest refusal for out-of-scope topics (B1.3), non-destructive chat clear markers, Question Quality Agent scoring clarity, specificity, and effort (B1.4), and Professor Approval Queue (`ApprovalQueue.tsx`) with bulk approve for confidence >= 0.90 (D11).
6. **Social & Analytics (M6)**: Announcements with embedded comment threads (D7), real-time course leaderboard computed with weighted D3 formula (50% asg + 30% proj + 20% doubts), learning analytics dashboard with AI override rate tracking, Curriculum Insights Copilot (`InsightsCopilot.tsx`) with 1-click announcement publish, personalized Study Coach (`StudyCoachPage.tsx`) with mastery sprints and `.ics` calendar export (D16), and student progress view (`StudentProgressPage.tsx`).
7. **Agent Governance & Admin (M7)**: Agent Control Center (`AgentControlCenter.tsx`) with per-course autonomy toggles, confidence thresholds (D11), auto-publish switch (D12), and token budget meter (D14); transparent Agent Memory Viewer (`AgentMemoryViewer.tsx`) with user deletion (D16); Event Simulator (`EventSimulator.tsx`) triggering B6 autonomous workflows; Admin Users & Courses directories.
8. **Platform Polish (M8)**: Universal Command Palette (Ctrl+K / Cmd+K) mounted in AppShell, Notifications Center popover wired into Topbar, tabbed Course Detail suites for Student (5 tabs) and Professor (6 tabs), 100% clean production build (`tsc -b && vite build`), and 30/30 Vitest tests passing across 8 suites.

## 5. Next Steps
1. Phase 0 is 100% complete. Await project owner instruction to begin **Phase 1: Express API and MongoDB** per ROADMAP.md.
2. In Phase 1: build `/backend` Express MVC server, Mongoose models matching `src/types`, port MSW handlers to controllers, swap `VITE_USE_MOCKS=false`, and run backend test suites.

## 6. Scope Rules
IN scope now:
- A frontend prototype in `/frontend`: React, React Router, Vite, Axios, TypeScript, Tailwind v4.
- An MSW mock backend serving the Section 5 routes and the EXTENSION routes.
- A simulated agent engine in `/frontend/src/mocks/agents` with deterministic scripted runs.
- Docs (brain.md, /docs, ROADMAP.md, README.md).

OUT of scope until the project owner explicitly says so:
- The Express API, MongoDB, FastAPI, ChromaDB, real LLM or embedding calls, Docker, and any real agent runtime.
- `/backend` and `/ai-service` contain only README placeholders.

## 7. Tech Stack and How to Run
- Node.js v24.16.0 / npm 11.13.0 (verified).
- Commands (run inside `/frontend`, verified):
  - `npm install`: install dependencies.
  - `npm run dev`: start local Vite dev server at `http://localhost:5173/`.
  - `npm run build`: compile TypeScript and Vite production bundle.
  - `npm run test` or `npx vitest run`: execute unit and integration test suites.
- Environment variables (names only, documented in `/frontend/.env.example`):
  - `VITE_API_BASE_URL` (default `/api`)
  - `VITE_USE_MOCKS` (`true` = MSW mock backend enabled)
- Demo accounts (verified in mock layer, password `demo1234`):
  - `admin@aicademy.dev`: Administrator (Ada Okafor)
  - `prof.rao@aicademy.dev`: Professor (Dr. Priya Rao)
  - `prof.chen@aicademy.dev`: Professor (Dr. Wei Chen)
  - `student1@aicademy.dev` ... `student8@aicademy.dev`: Students (`student1` = Aarav Sharma)
- One-Click Demo Role Switcher is available on the Login page and mounted in the topbar on every protected screen.

## 8. Architecture Map
Planned layout (not created yet unless listed in section 4 as done):
```
/brain.md, /AGENTS.md, /ROADMAP.md, /README.md     handoff, pointer, roadmap, setup (README in M8)
/docs/                                             verbatim sources of truth & UI_SPACING_AUDIT.md (done)
/backend/, /ai-service/                            README placeholders only (done)
/frontend/src/
  tokens/       spacing.ts (4px baseline scale tokens, touch target dimensions)
  context/      ThemeContext, AccentContext (accent swatches, contrast calculation, localStorage)
  types/        domain.ts (PDF models), agents.ts (EXTENSION models), api.ts
  services/     one Axios module per resource; http.ts holds base URL + bearer interceptor
  mocks/        browser.ts (MSW worker), handlers/* (one per resource), db/ (seed, store, rng)
  mocks/agents/ engine, registry (13 tools), orchestrator, 6 specialist agents, scenarios, pricing
  auth/         AuthContext, ProtectedRoute, RoleGuard
  hooks/        useAsync, useRunStream, useHotkey, useNotifications
  components/   ui/ (kit + FormField, ButtonGroup), layout/ (AppShell, Sidebar, Topbar, PageContainer, Section), agents/, charts/
  pages/        auth/, student/, professor/, admin/, common/ (Settings), agents/ (shared, role-gated)
```
Layering: pages → components and hooks → services (Axios) → HTTP → MSW handlers → mock store and mock agent engine. Pages never import from `mocks/`.
Routing: `/login` and `/register` are public. `/s/*` is student, `/p/*` professor, `/a/*` administrator. `/agents/*` is for professor and admin; a student can view only the traces of their own runs. `ProtectedRoute` checks the token and `RoleGuard` checks the role.
Service mapping: each service function calls exactly one route from /docs/ARCHITECTURE_SOURCE.md Section 5 or /docs/AGENTIC_DESIGN.md B5, with the same path and payload shape.
Backend swap: set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL=<real API>/api`. `main.tsx` starts MSW only when mocks are on. No service code changes.

## 9. Mock Agent Engine Explained
Status: fully implemented and verified (Milestones 3–8).
- `engine.startRun(agent, trigger, input, ctx)` creates an AgentRun (status `queued` → `running`) and runs the agent script asynchronously.
- Each agent is an async generator yielding AgentSteps (`plan`, `tool_call`, `observation`, `reflection`, `final`). Delays of 300–1200 ms come from a seeded random generator, so demos are repeatable.
- Tools are called only through `registry.call(name, input, ctx)`. The registry validates input and output with zod, enforces course scope and role, and logs latency. The 13 tools match B2.
- Guardrails: at most 12 steps per run, at most 2 retries per tool, a per-run token cap, the AgentPolicy daily budget, and a check that the agent is enabled.
- Demo switch: a global setting `simulate: 'normal' | 'failure' | 'low_confidence'`, plus a per-run override in "Run agent". The scripted scenarios live in `scenarios.ts`.
- Approvals: `request_human_approval` creates an ApprovalRequest and sets the run to `waiting_for_approval`. The decide route resumes the run.
- Streaming: the UI polls `GET /api/agents/runs/:runId` about every 400 ms through the `useRunStream` hook. It will be replaced by SSE in ROADMAP Phase 4.
- Implemented: Orchestrator, Ingestion, Grader, Tutor, Question Quality, Insights, Study Coach; 13 typed tools; 5 event triggers.

## 10. Data Models and Routes Summary
Types (all implemented in `/frontend/src/types`):

| Type | Origin |
|---|---|
| User, Course, Material, Assignment, Submission, Doubt, Announcement, Comment, Leaderboard, ChatClearMarker | PDF |
| AgentRun, AgentStep, ApprovalRequest, AgentMemory, AgentPolicy, ToolDefinition | EXTENSION |
| Notification; `Submission.aiEvaluation`; `Assignment.classification` values | EXTENSION / decision |

Routes (all mock-implemented in MSW handlers with full schema compliance):

| Routes | Origin |
|---|---|
| /api/auth/register, /login, /me | PDF |
| /api/courses (POST, GET), /:courseId/enroll, /:courseId/students | PDF |
| /api/courses/:courseId (GET, PUT), /api/courses/lookup?code= | EXTENSION |
| /api/materials (POST), /course/:courseId, /:materialId (PUT, DELETE), /:materialId/reindex | PDF |
| /api/assignments (POST), /course/:courseId, /:assignmentId (PUT, DELETE) | PDF |
| /api/submissions/:assignmentId/upload, /:assignmentId (GET), /:submissionId/score | PDF |
| /api/doubts/ask, /course/:courseId, /course/:courseId/clear | PDF |
| /api/announcements (POST), /course/:courseId, /:announcementId/comments | PDF |
| /api/leaderboard/:courseId (GET), /:courseId/recompute; /api/analytics/:courseId | PDF |
| /api/agents/* (runs, approvals, policy, memory, study-plan, insights) | EXTENSION (B5) |
| /api/notifications, /api/search, /api/admin/users, /api/admin/courses | EXTENSION |

## 11. Conventions
- TypeScript strict mode. No `any` unless commented. Shared types live only in `src/types`.
- Files: components are PascalCase `.tsx`; hooks are `useX.ts`; services are lowercase resource names (`courses.ts`).
- One service function per route. The function name is a verb plus the resource (`listCourseMaterials`).
- Styling: Tailwind v4 utilities plus `@theme inline` tokens in `src/index.css`. No hardcoded hex colors in components; use tokens. Reuse the `components/ui` kit; no ad-hoc one-off styles.
- Accent Color Tokens: stored in localStorage under `aicademy.accent`. CSS variables `--accent`, `--accent-hover`, `--accent-soft`, `--accent-contrast` mapped to Tailwind tokens (`bg-accent`, `text-accent`, `border-accent`, `ring-accent`, `text-accent-contrast`). Pre-paint `<head>` script applies theme and accent before DOM render. Automatic relative luminance WCAG AA contrast calculation (`#ffffff` or `#0b0f19`).
- Spacing System (4px baseline scale): strictly lock all margins, paddings, and gaps to the 4px scale (`0.5`=2px, `1`=4px, `1.5`=6px, `2`=8px, `3`=12px, `4`=16px, `5`=20px, `6`=24px, `8`=32px, `12`=48px, `16`=64px) defined in `src/tokens/spacing.ts`. Standard layout wrapper `px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto`. Section gaps `space-y-6 sm:space-y-8`. Card padding: standard `p-6`, compact `p-4`, hero banner `p-6 sm:p-8`. Form field rhythm: label-to-input `mb-1.5`, input-to-error `mt-1.5`, field gap `space-y-4`. Buttons: `sm` min 32px, `md` min 44px mobile / 40px desktop, `lg` min 48px. Button group gap: `gap-2` (compact) or `gap-3` (standard). Table cells: `px-4 sm:px-5 py-3.5 sm:py-4`. Mobile touch targets must be &ge;44px tall. All screens must exhibit zero horizontal scrollbar on 375px mobile viewport.
- Accessibility: every interactive element is keyboard reachable, has a visible focus ring and an ARIA label when icon-only, meets WCAG AA contrast, and has a unique `id` for browser tests.
- Every AI-generated element shows the `<AIBadge />`. Every EXTENSION feature shows `<ExtensionTag />` in the UI and an `// EXTENSION:` comment in code.
- Every agent action shows `<AutonomyBadge level="auto|needs_approval|never" />`.
- `// TODO(backend): ...` goes wherever the mock layer will be replaced by Express or MongoDB.
- `// TODO(agent-runtime): ...` goes wherever the simulated engine will be replaced by real agents.
- Every screen has loading (skeleton), empty and error states.

## 12. Decision Log
Append only. Never rewrite past entries; reverse a decision with a new entry that references the old one.
- **2026-10-05 D1:** Use Tailwind CSS **v4** (CSS-first `@theme`, `@tailwindcss/vite`). Reason: owner choice, modern setup. Rejected: v3.4, vanilla CSS.
- **2026-10-05 D2:** `Assignment.classification: 'assignment' | 'project'`. Individual work only. Reason: simplest reading of "project classification". Rejected: team projects.
- **2026-10-05 D3:** Leaderboard = 50% assignments + 30% projects + 20% doubt quality, each normalized 0–100, weights configurable per course, snapshot saved on recompute. Rejected: raw sums.
- **2026-10-05 D4:** One owning professor per course (PDF `professorRef`). Rejected for now: co-professors (see Open Questions).
- **2026-10-05 D5:** The administrator is read-only: users, courses, global agent activity, event simulator. No grading or posting. Rejected: full CRUD admin.
- **2026-10-05 D6:** Enroll by code: `GET /api/courses/lookup?code=` (EXTENSION), then `POST /api/courses/:courseId/enroll` with body `{ enrollmentCode }`. The professor can regenerate the code. Reason: the PDF route needs a courseId. Rejected: changing the PDF route.
- **2026-10-05 D7:** Add EXTENSION routes for course get and update, course lookup, admin lists, notifications and search. Comments come embedded in the `GET /api/announcements/course/:courseId` response. Rejected: a separate comments list route.
- **2026-10-05 D8:** Resubmitting before the due date is allowed and the latest counts; late submissions are accepted and flagged `late`.
- **2026-10-05 D9:** `Submission.aiEvaluation` (EXTENSION) is kept separate from the PDF `marks`; the override rate is derived from them. Rejected: overwriting the AI result.
- **2026-10-05 D10:** Upload limits. Materials: pdf, docx, pptx, txt or md, up to 20 MB. Submissions: pdf, docx, txt or zip, up to 10 MB. Filenames are sanitized on the client (and on the server later).
- **2026-10-05 D11:** Confidence thresholds: grader below 0.75 needs approval (per-course setting); tutor below 0.60 gives an honest "ask your professor"; bulk approve is allowed only for items at 0.90 or above.
- **2026-10-05 D12:** Auto-publish only shows *provisional* AI feedback to students (labeled "AI, pending review"). It **never** bypasses grade approval; marks appear only after professor approval. Draft announcements always need approval.
- **2026-10-05 D13:** Prompt injection: untrusted text is treated as data, tool authority comes only from the acting user, outputs are schema-validated, and the critic flags instruction-like content. A demo scenario shows an injected submission being flagged and sent to approval.
- **2026-10-05 D14:** Per-run limits: 12 steps, 2 retries per tool, a token cap, and the AgentPolicy daily budget. Cost and token figures are estimates from a mock price table, labeled "estimated".
- **2026-10-05 D15:** MSW v2 for mocks, polling at ~400 ms (`useRunStream`) for trace streaming, mock state saved in localStorage with a "Reset demo data" button, seeded random generator, dates relative to today. Rejected: an in-memory Axios adapter (it would change the swap path).
- **2026-10-05 D16:** Users may delete their own AgentMemory entries; "agents cannot delete data" applies to agents only. "Add to my calendar" means an in-app calendar plus an optional `.ics` download.
- **2026-10-05 D17:** Libraries: TypeScript strict, Recharts, lucide-react, zod, Vitest with React Testing Library. Recommended agent framework for Phase 4: LangGraph (justified in ROADMAP.md).
- **2026-10-05 D18:** Adopt DESIGN.md "Atoms Atelier" styling across all UI surfaces. (Superseded by D19).
- **2026-10-05 D19:** Adopt updated DESIGN.md "Quizlet" style system across all UI surfaces: Chalk Canvas #f6f7fb page floor, Paper White #ffffff card surfaces, Lilac Wash #edefff tinted panels, Mist Border #d9dde8 hairlines, Iris Bolt #4255ff brand accent for primary filled pill buttons (200px) and active states, Ink Charcoal #282e3e headings/body, Slate Veil #586380 muted text, standard 8px card radius, 24px pastel feature category cards (cyan/violet) with 8px white inner cards, Inter typography (substitute for Hurme Geometric Sans), 200px pill topbar search bar, and clean subtle elevation (rgba(40,46,62,0.1) 0px 4px 16px 0px). Replaces D18 Atoms Atelier.
- **2026-10-05 D20:** Material upload API supports JSON metadata with simulated files for prototype parity across browser and Node/Vitest test environments without Undici webidl multipart inconsistencies.
- **2026-10-05 D21:** Accent Color System implemented via CSS variables `--accent`, `--accent-hover`, `--accent-soft`, `--accent-contrast`, `--accent-rgb` mapped in Tailwind config / `@theme inline`. 12 curated presets (Iris Indigo `#4255ff`, Ocean Blue `#2563eb`, Electric Cyan `#0891b2`, Deep Teal `#0d9488`, Forest Emerald `#059669`, Sunburst Amber `#d97706`, Sunset Coral `#ea580c`, Crimson Rose `#e11d48`, Vivid Pink `#db2777`, Neon Fuchsia `#c026d3`, Amethyst Violet `#7c3aed`, Royal Purple `#9333ea`) + custom color picker. Swatches display clean names without raw hex codes. Stored in localStorage `aicademy.accent` with pre-paint `<head>` script to eliminate FOUC. Automatic WCAG AA contrast calculation for button/badge text.
- **2026-10-05 D22:** UI Spacing System locked to strict 4px grid. Standardized layout via `tokens/spacing.ts`, `PageContainer`, `Section`, `Card` padding variants, `FormField`, and `ButtonGroup`. Converted fixed sidebar to mobile off-canvas drawer with backdrop overlay to eliminate horizontal scrollbar on 375px screens. Touch targets guaranteed &ge;44px on mobile. Documented in `/docs/UI_SPACING_AUDIT.md`.
- **2026-10-05 D23:** Solid & Frosted Glass Architecture. Elevated UI surfaces with `backdrop-blur-xl`, `bg-surface/80-90`, and crisp hairline borders across Topbar, Sidebar, Cards, and Modals. (Superseded by D24).
- **2026-10-05 D24:** Clean Educational Canvas Restoration. Removed ambient multi-colored background light orbs and saturated banner gradients to ensure an authoritative, academic, distraction-free interface (Chalk Canvas `#f6f7fb` in light mode, Paper White `#ffffff` card surfaces, crisp `#d9dde8` hairlines). Replaces D23 ambient orbs.
- **2026-10-05 D25:** AppShell Viewport Layout & Sidebar Scroll Isolation. Fixed sidebar scroll breakage by converting `AppShell` root to `h-screen h-[100dvh] flex overflow-hidden`, isolating page vertical scrolling to `flex-1 flex flex-col h-screen h-[100dvh] min-w-0 overflow-y-auto`, and making desktop `Sidebar` a static full-height flex column (`h-full shrink-0 md:static`) with `shrink-0` pinned header and footer controls. Ensures sidebar is 100% frozen in place when page content scrolls.
- **2026-11-01 D26:** Production Readiness & Demo Removal. Implemented complete Express API in `/backend` (MVC architecture, JWT, Multer file storage, rate limits, CORS, Helmet, seed data, and unit/integration tests). Removed prominent demo personas from Login and Topbar by default (guarded behind `VITE_ENABLE_DEMO_SWITCHER=false`), defaulted login form to empty fields, eliminated demo prompt strings, resolved raw fetch calls in admin directories and agent trace viewers via centralized `http` client, added `frontend/src/services/admin.ts`, and authored `docker-compose.yml` with multi-stage Dockerfiles for full deployment readiness.
- **2026-11-03 D27:** Vercel Full-Stack Deployment Configuration. Configured root `package.json` with npm workspaces (`frontend`, `backend`), root `vercel.json` with SPA routing and `/api/(.*)` serverless function rewrites, serverless entrypoint `api/index.ts` bridging to Express, `/tmp/uploads` fallback for Vercel ephemeral lambda environments, and standalone `frontend/vercel.json`. Verified with clean root build.
- **2026-11-03 D28:** Git Repository Initialization & Remote Push. Initialized Git repository, configured root `.gitignore`, committed all 180 project files across frontend, backend, docker and deployment configs (`908083b`), and successfully pushed to remote origin `https://github.com/nikunjsrivastav/AiCademy.git` on branch `main`.
- **2026-11-03 D29:** Vercel Services Renaming. Updated `vercel.json` to name the multi-service deployment services `web` (frontend) and `api` (backend) with public routing for `/api/(.*)`, `/uploads/(.*)` to `api` and `/(.*)` to `web`. Pushed to GitHub `main`.
- **2026-11-03 D30:** Explicit Vercel Services Framework Resolution. Added `"framework": "express"` to `api` and `"framework": "vite"` to `web` in `vercel.json` to eliminate ambiguous multi-framework detection (`[MULTIPLE_FRAMEWORKS_SERVICE] Express vs Container due to Dockerfile`). Pushed to GitHub `main`.
- **2026-11-03 D31:** Live Dynamic Student Dashboard. Replaced hardcoded demo stat metrics with real reactive calculations in `StudentDashboard.tsx`: dynamically fetches enrolled courses, cross-course assignments, submission statuses, doubts inquiry history, and course leaderboard ranking. Added live enrolled course cards with direct classroom routing, upcoming deadlines with submission action buttons, and recent AI Tutor grounded citations. Integrated tab deep-linking (`?tab=...`) in `StudentCourseDetail.tsx`.
- **2026-11-03 D32:** Groq AI Provider Integration. Installed `groq-sdk` in `/backend`, created `backend/src/services/aiService.ts` executing Llama 3.3 70B (`llama-3.3-70b-versatile`) for syllabus-grounded Tutor RAG, structured Question Quality scoring, and Rubric Grading with prompt-injection critic defense. Added automatic deterministic fallback when `GROQ_API_KEY` is not supplied or during model unavailability (per PDF 3.3). Documented in `backend/.env.example` and pushed to GitHub `main`.

## 13. Known Issues and Tech Debt
- Everything the mock layer fakes (auth tokens, vector search, embeddings, grading, costs) must be built for real in ROADMAP Phases 1–5. These spots will carry `TODO(backend)` and `TODO(agent-runtime)` comments.

## 14. Open Questions
- Co-professors or TAs per course? Recommended default: keep one owner; add `coProfessorRefs` as an EXTENSION in Phase 1 if needed.
- Data retention period for doubts and submissions? Recommended default: keep them for the course duration plus one year; define in Phase 6.
- Should students see professors' notes on approval decisions? Recommended default: no, only the final feedback.
- Should leaderboard names be anonymized for students? Recommended default: show the top 10 by name and the student's own rank; offer an opt-out toggle later.

## 15. Gotchas and Do-Not-Do List
- Do not build the backend, database, AI service, vector store or real LLM calls until the owner says so.
- Do not hardcode API keys or secrets anywhere. Use env variable names and `.env.example` only.
- Do not let any agent or tool read data outside the acting user's course; `vector_search` is always filtered by courseId.
- Do not let agents finalize grades, delete data or publish announcements without approval.
- Do not rename or reshape the PDF routes in Section 5; add new routes as EXTENSION instead.
- Do not remove EXTENSION markers, AI badges, or the TODO(backend) and TODO(agent-runtime) comments.
- Do not edit /docs/ARCHITECTURE_SOURCE.md or /docs/AGENTIC_DESIGN.md; they are verbatim.
- Do not import from `src/mocks` inside pages or components; go through `src/services`.
- Do not claim something works without running it; mark it "unverified".

## 16. Handoff Instructions for the Next Agent
1. Read this file fully, then /docs/ARCHITECTURE_SOURCE.md, /docs/AGENTIC_DESIGN.md and /ROADMAP.md.
2. If `/frontend` exists: `cd frontend && npm install && npm run dev`, open the printed URL, log in with a demo account (section 7), and confirm the app starts.
3. Check the milestone table in section 4 and continue with section 5 (Next Steps) in order.
4. Follow sections 11 (Conventions) and 15 (Do-Not-Do).
5. At the end of each milestone: test in the browser, fix errors, update this file (sections 4, 5, 8–10, 12, 13, 17), and run the handoff test (re-read this file as a brand-new agent and fix any gaps).
6. Pause for owner feedback at the end of every milestone. Ask the owner before changing scope.

- **2026-10-30: Phase 0 Completion (Milestones 3 through 8).** Delivered the complete agentic AI educational operating system prototype:
  1. **Milestone 3 (Agent Engine, Tool Registry, Orchestrator, Ingestion, Trace Viewer)**: Built deterministic async generator agent engine (`src/mocks/agents/engine.ts`) with step streaming, max 12 steps, 2 retries, token pricing estimates (`pricing.ts`), and 13 typed tools (`src/mocks/agents/registry.ts`) with Zod schemas and course scope isolation. Created Ingestion Agent and Orchestrator. Created `useRunStream` hook, MSW agent handlers (`/api/agents/runs`, `/api/agents/runs/:runId`), streaming Agent Trace Viewer (`AgentTraceViewer.tsx`), and Agent Runs Dashboard (`AgentRunsList.tsx`). Unit tests in `src/test/agents.test.ts`.
  2. **Milestone 4 (Assignments, Rubrics, Submissions, Grader Agent, Score Override)**: Created Assignment and Submission services and MSW handlers with format/size validation (PDF, DOCX, TXT, ZIP up to 10MB per D10), multi-criterion Rubric Builder (D2), version incrementing and late submission flagging (D8). Implemented Rubric Grader Agent with prompt-injection critic defense (D13), human review threshold (D12), and professor score override preserving original AI evaluations (D9). Unit tests in `src/test/assignments.test.ts`.
  3. **Milestone 5 (Tutor Chat, Question Quality Agent, Approval Queue)**: Built Doubts service and MSW handlers with non-destructive chat clearing. Implemented RAG Tutor Agent with source citations and honest refusal for ungrounded queries (B1.3). Implemented Question Quality Agent scoring clarity, specificity, and effort (B1.4). Built Professor Approval Queue (`ApprovalQueue.tsx`) with bulk approval for confidence >= 0.90 (D11) and manual score/feedback overrides. Unit tests in `src/test/doubts.test.ts`.
  4. **Milestone 6 (Social, Leaderboard, Analytics, Insights, Study Coach)**: Built Announcements service and handlers with embedded comment threads (D7). Implemented dynamic Leaderboard service with weighted D3 formula (50% asg + 30% proj + 20% doubts) and snapshot recomputing. Implemented Analytics service tracking grade distributions and AI override rate. Built Curriculum Insights Copilot (`InsightsCopilot.tsx`) with 1-click announcement publish. Built personalized Study Coach (`StudyCoachPage.tsx`) with mastery sprints and `.ics` calendar export (D16). Built Student Progress view (`StudentProgressPage.tsx`). Unit tests in `src/test/social_analytics.test.ts`.
  5. **Milestone 7 (Agent Control Center, Memory Viewer, Simulator, Admin)**: Built Agent Control Center (`AgentControlCenter.tsx`) with course policy sliders for autonomy, confidence thresholds (D11), auto-publish switch (D12), and token budget meters (D14). Built Agent Memory Viewer (`AgentMemoryViewer.tsx`) with user transparency and self-deletion (D16). Built Event Simulator (`EventSimulator.tsx`) for Section B6 triggers (material uploaded, submission received, doubt asked, weekly summary, deadline approaching). Built Admin Users and Courses directory pages with MSW handlers (`/api/admin/users`, `/api/admin/courses`).
  6. **Milestone 8 (Universal Navigation, Polish, Multi-Tab Upgrades, Full Test Suite)**: Upgraded Student Course Detail (`StudentCourseDetail.tsx`) into a 5-tab suite (Materials, Assignments, AI Tutor, Announcements, Leaderboard) and Professor Course Detail (`ProfessorCourseDetail.tsx`) into a 6-tab suite (Materials, Assignments with Rubric Builder & grading modal, Roster, Analytics, Announcements, Leaderboard). Created universal Command Palette (`CommandPalette.tsx`) with Ctrl+K / Cmd+K keyboard shortcut and mounted in `AppShell`. Created Notifications popover (`NotificationsPopover.tsx`) with real-time mark-all-read. Wired all routes in `App.tsx`.
  7. **Quality Assurance & Verification**: Resolved strict TypeScript compilation across all new pages and components. Production build (`npm run build`, running `tsc -b && vite build`) built cleanly with zero errors. Full Vitest test suite (`npm test`) passes 100% (8 test files, 30 tests passing).
- **2026-10-05: Topbar Spacing & Padding Realignment.** Fixed uneven spacing around "Professor Studio" in the Topbar:
  1. Balanced horizontal padding across the Topbar with `px-6 sm:px-8` matching sidebar and main content margins.
  2. Integrated an anchored 36px icon badge (`w-9 h-9 rounded-[8px] bg-accent-soft border border-accent/20`) dynamically tailored to the workspace (`GraduationCap` for Professor Studio, `Sparkles` for Student, `ShieldAlert` for Admin).
  3. Aligned title and subtitle in a flex container vertically centered on the exact 36px axis of the search bar and switcher controls, eliminating awkward top hugging. Verified with clean production build and 17/17 Vitest tests passing.
- **2026-10-05: Clean Background Restoration & Sidebar Scroll Lock.** Addressed user feedback regarding background coloring and scrolling:
  1. Removed multi-colored ambient background light orbs and saturated banner gradients from `AppShell.tsx`, `ProfessorDashboard.tsx`, `StudentDashboard.tsx`, and `AdminOverview.tsx`. Restored clean, official, distraction-free educational canvas (Chalk Canvas `#f6f7fb` on Paper White `#ffffff`).
  2. Fixed sidebar scrolling breakage: converted `AppShell` root to `h-screen h-[100dvh] overflow-hidden flex`, isolated content scroll to `flex-1 flex flex-col h-screen h-[100dvh] min-w-0 overflow-y-auto`, and locked desktop `Sidebar` to full viewport height (`h-full shrink-0 md:static`) with `shrink-0` brand header and user controls. Verified sidebar stays 100% frozen in place when page scrolls.
  3. Validated with `npm run build` and `npx vitest run` (17/17 tests passing). Verified via browser screenshots.
- **2026-10-05: Documentation & Project README.** Authored comprehensive root `README.md` and `frontend/README.md`. Included shields badges, table of contents, problem/solution overview, Mermaid architecture and agent topology diagrams, 13 typed tool specifications, human-in-the-loop safety principles, 12-preset accent color showcase with contrast engine, 4px baseline spacing standards, 1-click demo personas table, step-by-step interactive demo script, and backend migration guide. All 17 Vitest tests passing.
- **2026-10-05: Accent Color System & UI Spacing Audit.** Completed Task 1 and Task 2:
  1. Built full Accent Color system (`src/context/AccentContext.tsx`) with 6 preset palettes (Iris Indigo `#4255ff`, Ocean Blue `#2563eb`, Forest Emerald `#059669`, Crimson Rose `#e11d48`, Sunburst Amber `#d97706`, Amethyst Violet `#7c3aed`) + native hex picker. Implemented dynamic CSS variables (`--accent`, `--accent-hover`, `--accent-soft`, `--accent-contrast`), live preview card with WCAG AA compliance text contrast calculation, pre-paint `<head>` script preventing color flash, and localStorage persistence under `aicademy.accent`. Replaced hardcoded accent hexes across all UI kit components, AppShell, Sidebar, Topbar, DemoRoleSwitcher, and pages. Mounted Settings page (`/settings`, `/s/settings`, `/p/settings`, `/a/settings`).
  2. Executed complete UI Spacing Audit across mobile (375px), tablet (768px), and desktop (1280px+). Defined 4px baseline scale tokens (`src/tokens/spacing.ts`) and reusable layout primitives (`PageContainer`, `Section`, `Card` padding prop, `FormField`, `ButtonGroup`). Converted fixed sidebar to mobile off-canvas drawer with hamburger toggle, eliminating horizontal scrollbar on 375px mobile screens. Enforced &ge;44px touch targets on mobile buttons. Documented all 17 findings and resolutions in `/docs/UI_SPACING_AUDIT.md`.
  3. Validated with `npm run build` (clean build) and Vitest (17/17 tests passing). Verified across all viewports in light and dark mode with browser subagent.
  Next: Milestone 3 (mock agent engine, tool registry, Orchestrator, Ingestion Agent, Agent Trace Viewer).
- **2026-10-05: Milestone 2 (Course and material flows).** Implemented Section 5.2 Course & Material flows: seeded 3 university courses (CS301, CS220, AI410) with pre-indexed vector materials (chunk counts, topics, MIME types). Created `src/services/courses.ts`, `src/services/materials.ts`, and full MSW handlers with auth & role guards (`/courses`, `/courses/lookup?code=`, `/:courseId/enroll`, `/:courseId/students`, `/materials`, `/materials/course/:courseId`, `/:materialId/reindex`). Built Student Course Catalog (`/s/courses`) with "Join with Code" modal (live lookup preview & duplicate enrollment block) and Student Course Detail (`/s/courses/:courseId`) with Vector Ingestion Transparency modal. Built Professor Course Studio (`/p/courses`) with course creator and click-to-copy code, and Professor Course Management (`/p/courses/:courseId`) with active code banner + regenerate code trigger, enrolled student roster table, and drag-and-drop Material Manager with validation (PDF, DOCX, PPTX, TXT, MD up to 20MB per D10), sanitization, vector-indexing status badges, and reindex trigger. 17/17 Vitest tests passing; verified in live browser walkthrough.
  Next: Milestone 3 (mock agent engine, tool registry, Orchestrator, Ingestion Agent, Agent Trace Viewer).
- **2026-10-05: UI Consistency & Border-Radius Alignment.** Resolved stat card and button border-radius inconsistencies: standardized all button roundness to `rounded-[8px]` matching surrounding card containers, unified `StatCard` layout with top-right icons across all cards and bottom-row badges/trends with `whitespace-nowrap` (preventing multiline text wrapping), aligned badges to `rounded-[6px]`, and set all inputs and controls to matching `rounded-[8px]`. All 7 tests passing; verified in live browser walkthrough.
- **2026-10-05: Design System Alignment (Quizlet Style Reference).** Adopted updated DESIGN.md "Quizlet" styling across all UI surfaces: Chalk Canvas #f6f7fb page floor, Paper White #ffffff surfaces, Lilac Wash #edefff tinted hero banners, 8px standard card radii, Iris Bolt #4255ff brand accent, and Inter typography. Verified across dashboards and login.
- **2026-10-05: Design System Alignment (Atoms Atelier).** Adopted DESIGN.md "Atoms Atelier" styling across the UI (Superseded by Quizlet).
- **2026-10-05: Milestone 1 (scaffold, design system, auth, workspaces).** Scaffolded `/frontend` with React 19 + TypeScript + Vite 8 + Tailwind v4 CSS tokens. Built UI kit, MSW v2 mock auth, JWT sign/verify, ProtectedRoute, RoleGuard, and AppShell. Created Login/Register screens, DemoRoleSwitcher (11 personas), theme toggle, and workspaces for Student, Professor, and Admin. 7 tests passing; verified in browser walkthrough.
  Next: Milestone 2 (course and material flows).
- **2026-10-05: Milestone 0 (docs setup).** Completed Step 0 review; the owner approved defaults D1–D17 and the implementation plan.
  Created /docs/ARCHITECTURE_SOURCE.md and /docs/AGENTIC_DESIGN.md (verbatim), brain.md, AGENTS.md, ROADMAP.md, /backend/README.md, /ai-service/README.md.
