from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# PDF Section 3.3 Internal AI Schemas
# ---------------------------------------------------------------------------

class IngestMaterialRequest(BaseModel):
    courseId: str
    materialId: str
    title: str
    content: Optional[str] = None
    fileUrl: Optional[str] = None
    mimeType: Optional[str] = "text/plain"

class IngestMaterialResponse(BaseModel):
    success: bool
    materialId: str
    chunkCount: int
    topics: List[str]
    status: str = "indexed"

class RubricCriterion(BaseModel):
    id: str
    name: str
    description: str
    maxMarks: float

class EvaluateAssignmentRequest(BaseModel):
    courseId: str
    assignmentTitle: str
    rubricCriteria: List[RubricCriterion]
    submissionText: str
    studentName: Optional[str] = "Student"

class RubricScoreItem(BaseModel):
    criterionId: str
    name: str
    awardedMarks: float
    maxMarks: float
    criterionFeedback: str

class EvaluateAssignmentResponse(BaseModel):
    marks: float
    percentage: float
    feedback: str
    rubricScores: List[RubricScoreItem]
    strengths: List[str]
    mistakes: List[str]
    suggestions: List[str]
    flaggedByCritic: bool = False
    confidence: float = 0.92
    needsHumanApproval: bool = False

class Citation(BaseModel):
    materialId: str
    title: str
    pages: List[int]
    snippet: Optional[str] = None

class AskDoubtRAGRequest(BaseModel):
    courseId: str
    question: str
    chatHistory: Optional[List[Dict[str, str]]] = []

class AskDoubtRAGResponse(BaseModel):
    answer: str
    citations: List[Citation]
    confidence: float
    outOfScope: bool

class DoubtQualityBreakdown(BaseModel):
    clarity: int
    specificity: int
    effort: int

class ScoreDoubtQualityRequest(BaseModel):
    question: str
    courseId: Optional[str] = None

class ScoreDoubtQualityResponse(BaseModel):
    score: int
    breakdown: DoubtQualityBreakdown
    feedback: str

# ---------------------------------------------------------------------------
# EXTENSION Agent Execution Schemas (B1, B2, B3)
# ---------------------------------------------------------------------------

AgentKind = Literal[
    "orchestrator",
    "ingestion",
    "tutor",
    "question_quality",
    "grader",
    "insights",
    "study_coach"
]

StepKind = Literal["plan", "tool_call", "observation", "reflection", "final"]

class AgentStepModel(BaseModel):
    id: str
    runId: str
    index: int
    kind: StepKind
    content: str
    toolName: Optional[str] = None
    toolInput: Optional[Dict[str, Any]] = None
    toolOutput: Optional[Dict[str, Any]] = None
    latencyMs: int
    tokensUsed: int
    timestamp: str

class AgentRunResponse(BaseModel):
    id: str
    agent: AgentKind
    trigger: str
    status: Literal["queued", "running", "waiting_for_approval", "completed", "failed", "cancelled"]
    courseId: str
    actorId: str
    actorRole: str
    startedAt: str
    finishedAt: Optional[str] = None
    summary: Optional[str] = None
    confidence: Optional[float] = None
    totalTokens: int = 0
    estimatedCostUsd: float = 0.0
    steps: List[AgentStepModel] = []

class ToolDefinitionModel(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]
    permissionRole: Literal["all", "student", "professor", "admin"]

