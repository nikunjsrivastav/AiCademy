# /ai-service (reserved, NOT implemented)

Future home of the FastAPI AI service described in /docs/ARCHITECTURE_SOURCE.md Section 3.3:
- PDF internal routes: /ingest-material, /evaluate-assignment, /ask-doubt-rag, /score-doubt-quality
- EXTENSION agent routes (/docs/AGENTIC_DESIGN.md B5): /agents/orchestrate, /agents/tutor, /agents/grade,
  /agents/ingest, /agents/insights, /agents/coach
- ChromaDB vector store, OpenAI / Groq models, and the agent runtime (LangGraph is recommended in ROADMAP.md)

Do not implement anything here until the project owner starts ROADMAP.md Phase 2.
Until then, agents are simulated in `/frontend/src/mocks/agents` (marked `TODO(agent-runtime)`).
This service is internal only: the browser must never call it directly.
