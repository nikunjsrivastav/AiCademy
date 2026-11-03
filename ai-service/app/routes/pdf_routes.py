from fastapi import APIRouter, HTTPException, File, UploadFile
import os
import tempfile

try:
    from app.models import (
        IngestMaterialRequest,
        IngestMaterialResponse,
        EvaluateAssignmentRequest,
        EvaluateAssignmentResponse,
        AskDoubtRAGRequest,
        AskDoubtRAGResponse,
        ScoreDoubtQualityRequest,
        ScoreDoubtQualityResponse,
    )
    from app.vector_store import vector_store
    from app.evaluator import evaluate_submission
    from app.tutor import answer_doubt_rag, score_doubt_quality
except ImportError:
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

@router.post("/convert-docling")
async def convert_docling(file: UploadFile = File(...)):
    """
    IBM Docling document conversion endpoint.
    Converts academic PDFs, LaTeX documents, and formulas into pristine structured Markdown.
    """
    tmp_path = None
    try:
        # Dynamically import docling so service still boots if docling is not pre-installed
        from docling.document_converter import DocumentConverter

        suffix = os.path.splitext(file.filename or "doc.pdf")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        converter = DocumentConverter()
        conv_res = converter.convert(tmp_path)
        markdown = conv_res.document.export_to_markdown()

        return {
            "success": True,
            "text": markdown,
            "format": "markdown",
            "pageCount": len(conv_res.document.pages) if hasattr(conv_res.document, "pages") else 1
        }
    except ImportError:
        raise HTTPException(
            status_code=501,
            detail="Docling is not installed in the python environment. Run: pip install docling"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Docling conversion failed: {str(e)}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass


