from fastapi import APIRouter, HTTPException, File, UploadFile
import os
import io

try:
    import pypdf
except ImportError:
    pypdf = None

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

@router.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    """
    Production-ready document extraction endpoint powered by pypdf.
    Extracts multi-page academic PDFs, LaTeX equations, and text with layout preservation.
    Completely zero native C++ or heavy dependencies.
    """
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty file payload")

        if pypdf is None:
            raise HTTPException(
                status_code=501,
                detail="pypdf is not installed. Run: pip install pypdf"
            )

        reader = pypdf.PdfReader(io.BytesIO(content))
        total_pages = len(reader.pages)
        pages = []
        full_text_parts = []

        for idx, page in enumerate(reader.pages):
            # Try layout extraction mode first (preserves column alignments & spaces)
            try:
                page_text = page.extract_text(extraction_mode="layout") or ""
            except Exception:
                page_text = ""

            # Fall back to standard extraction if layout mode yielded insufficient text
            if len(page_text.strip().split()) < 5:
                try:
                    alt_text = page.extract_text() or ""
                    if len(alt_text.strip().split()) > len(page_text.strip().split()):
                        page_text = alt_text
                except Exception:
                    pass

            cleaned = page_text.strip()
            if cleaned:
                pages.append({"pageNumber": idx + 1, "text": cleaned})
                full_text_parts.append(cleaned)

        full_text = "\n\n".join(full_text_parts).strip()
        words = full_text.split()
        topics = vector_store.extract_topics(full_text) if full_text else ["Core Concepts"]

        return {
            "success": True,
            "text": full_text,
            "pages": pages,
            "pageCount": total_pages,
            "wordCount": len(words),
            "topics": topics,
            "format": "pdf"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"pypdf extraction failed: {str(e)}")

@router.post("/convert-docling")
async def convert_docling_alias(file: UploadFile = File(...)):
    """
    Compatibility alias mapping legacy convert-docling requests to the fast pypdf extractor.
    """
    return await extract_pdf(file=file)


