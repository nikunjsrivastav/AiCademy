from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body
from ..models import AgentRunResponse, ToolDefinitionModel
from ..agents.registry import get_registered_tools
from ..agents.orchestrator import execute_agent_run

router = APIRouter(prefix="/agents", tags=["EXTENSION Agent Endpoints"])

@router.get("/tools", response_model=List[ToolDefinitionModel])
def list_tools():
    return get_registered_tools()

@router.post("/orchestrate", response_model=AgentRunResponse)
def run_orchestrator(payload: Dict[str, Any] = Body(...)):
    course_id = payload.get("courseId", "general")
    actor_id = payload.get("actorId", "u_orchestrator")
    actor_role = payload.get("actorRole", "professor")
    trigger = payload.get("trigger", "manual_invocation")
    return execute_agent_run("orchestrator", trigger, course_id, actor_id, actor_role, payload)

@router.post("/tutor", response_model=AgentRunResponse)
def run_tutor(payload: Dict[str, Any] = Body(...)):
    course_id = payload.get("courseId", "general")
    actor_id = payload.get("actorId", "u_student")
    actor_role = payload.get("actorRole", "student")
    trigger = payload.get("trigger", "doubt_asked")
    return execute_agent_run("tutor", trigger, course_id, actor_id, actor_role, payload)

@router.post("/grade", response_model=AgentRunResponse)
def run_grader(payload: Dict[str, Any] = Body(...)):
    course_id = payload.get("courseId", "general")
    actor_id = payload.get("actorId", "u_prof")
    actor_role = payload.get("actorRole", "professor")
    trigger = payload.get("trigger", "submission_received")
    return execute_agent_run("grader", trigger, course_id, actor_id, actor_role, payload)

@router.post("/ingest", response_model=AgentRunResponse)
def run_ingest(payload: Dict[str, Any] = Body(...)):
    course_id = payload.get("courseId", "general")
    actor_id = payload.get("actorId", "u_prof")
    actor_role = payload.get("actorRole", "professor")
    trigger = payload.get("trigger", "material_uploaded")
    return execute_agent_run("ingestion", trigger, course_id, actor_id, actor_role, payload)

@router.post("/insights", response_model=AgentRunResponse)
def run_insights(payload: Dict[str, Any] = Body(...)):
    course_id = payload.get("courseId", "general")
    actor_id = payload.get("actorId", "u_prof")
    actor_role = payload.get("actorRole", "professor")
    trigger = payload.get("trigger", "weekly_summary")
    return execute_agent_run("insights", trigger, course_id, actor_id, actor_role, payload)

@router.post("/coach", response_model=AgentRunResponse)
def run_coach(payload: Dict[str, Any] = Body(...)):
    course_id = payload.get("courseId", "general")
    actor_id = payload.get("actorId", "u_student")
    actor_role = payload.get("actorRole", "student")
    trigger = payload.get("trigger", "deadline_approaching")
    return execute_agent_run("study_coach", trigger, course_id, actor_id, actor_role, payload)
