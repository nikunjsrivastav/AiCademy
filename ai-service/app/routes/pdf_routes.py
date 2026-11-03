from fastapi import APIRouter, HTTPException, Depends
from ..models import (
    IngestMaterialRequest,
    IngestMaterialResponse,
    EvaluateAssignmentRequest,
    EvaluateAssignmentResponse,
    AskDoubtRAGRequest,
    AskDoubtRAGResponse,
    ScoreDoubtQualityRequest,
    ScoreDoubtQualityResponse,
)
from ..vector_store import vector_store
from ..evaluator import evaluate_submission
from ..tutor import answer_doubt_rag, score_doubt_quality

router = APIRouter(tags=["PDF Architecture Endpoints"])

@router.post("/ingest-material", response_model=IngestMaterialResponse)
def ingest_material(req: IngestMaterialRequest):
    try:
        content = req.content or f"Curriculum document: {req.title}. Core concepts, algorithms, and review modules."
        chunks = vector_store.add_material(
            course_id=req.courseId,
            material_id=req.materialId,
            title=req.title,
            content=content
        )
        topics = vector_store.extract_topics(content)
        return IngestMaterialResponse(
            success=True,
            materialId=req.materialId,
            chunkCount=len(chunks),
            topics=topics,
            status="indexed"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate-assignment", response_model=EvaluateAssignmentResponse)
def evaluate_assignment(req: EvaluateAssignmentRequest):
    try:
        return evaluate_submission(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ask-doubt-rag", response_model=AskDoubtRAGResponse)
def ask_doubt(req: AskDoubtRAGRequest):
    try:
        return answer_doubt_rag(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/score-doubt-quality", response_model=ScoreDoubtQualityResponse)
def score_quality(req: ScoreDoubtQualityRequest):
    try:
        return score_doubt_quality(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
