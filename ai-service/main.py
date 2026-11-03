import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes.pdf_routes import router as pdf_router
from app.routes.agent_routes import router as agent_router
from app.groq_client import groq_service

app = FastAPI(
    title="AiCademy AI Service",
    description="Agentic & Curriculum AI Microservice powering Syllabus RAG, Rubric Evaluation, and Autonomous Agents.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "AiCademy AI Microservice",
        "llmProvider": "Groq Llama 3.3 70B" if groq_service.is_available() else "Heuristic Deterministic Fallback",
        "groqConnected": groq_service.is_available(),
        "model": settings.MODEL_NAME,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": "1.0.0"
    }

# Mount routes
app.include_router(pdf_router)
app.include_router(agent_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
