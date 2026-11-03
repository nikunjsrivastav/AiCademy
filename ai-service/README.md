# AiCademy AI Service

High-performance Python FastAPI AI microservice powering:
- **PDF Architecture Endpoints**:
  - `POST /ingest-material`: Normalized text chunking (~800 characters) and topic extraction.
  - `POST /evaluate-assignment`: Syllabus RAG + Groq (`llama-3.3-70b-versatile`) Academic Evaluator with Professor Eleanor Vance persona, multi-criterion rubric scoring, and prompt-injection critic defense (D13).
  - `POST /ask-doubt-rag`: Course-isolated syllabus RAG Tutor retrieval with slide/page citations and honest refusal for ungrounded queries (B1.3).
  - `POST /score-doubt-quality`: Pedagogical inquiry depth scoring across clarity (35%), specificity (35%), and demonstrated effort (30%) (B1.4).
- **EXTENSION Agentic Endpoints**:
  - `POST /agents/orchestrate`: Master agent planning and decomposition trace.
  - `POST /agents/tutor`: Autonomous syllabus tutor agent loop.
  - `POST /agents/grade`: Autonomous grader with human-in-the-loop review threshold gating.
  - `POST /agents/ingest`: Material ingestion, chunking, and self-test verification.
  - `POST /agents/insights`: Curriculum insight and doubt pattern clustering.
  - `POST /agents/coach`: Personalized study coach synthesizing 3-step mastery sprint and `.ics` calendar payload.
  - `GET /agents/tools`: 13 typed tool specifications (B2).

## How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment (optional, defaults to port 8000)
cp .env.example .env

# 3. Start service
python main.py
```

The service runs at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/docs`.
