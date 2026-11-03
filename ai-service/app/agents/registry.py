from typing import Dict, Any, List
from ..models import ToolDefinitionModel

TOOLS: List[ToolDefinitionModel] = [
    ToolDefinitionModel(
        name="vector_search",
        description="Searches indexed course materials for relevant syllabus passages.",
        parameters={
            "courseId": {"type": "string", "required": True},
            "query": {"type": "string", "required": True},
            "topK": {"type": "integer", "default": 3}
        },
        permissionRole="all"
    ),
    ToolDefinitionModel(
        name="chunk_and_embed",
        description="Splits course document text into overlapping segments and stores vector embeddings.",
        parameters={
            "materialId": {"type": "string", "required": True},
            "courseId": {"type": "string", "required": True},
            "chunkSize": {"type": "integer", "default": 800}
        },
        permissionRole="professor"
    ),
    ToolDefinitionModel(
        name="extract_text",
        description="Extracts normalized plaintext from PDF, DOCX, PPTX, or Markdown files.",
        parameters={
            "fileUrl": {"type": "string", "required": True},
            "mimeType": {"type": "string", "required": True}
        },
        permissionRole="professor"
    ),
    ToolDefinitionModel(
        name="run_self_test",
        description="Performs an automated retrieval sanity check on newly indexed material.",
        parameters={
            "materialId": {"type": "string", "required": True},
            "courseId": {"type": "string", "required": True}
        },
        permissionRole="professor"
    ),
    ToolDefinitionModel(
        name="score_rubric",
        description="Evaluates a student submission against multi-criterion rubrics.",
        parameters={
            "submissionId": {"type": "string", "required": True},
            "rubricCriteria": {"type": "array", "required": True}
        },
        permissionRole="professor"
    ),
    ToolDefinitionModel(
        name="check_prompt_injection",
        description="Scans input text for adversarial prompt injection, jailbreaks, and role escapes.",
        parameters={
            "text": {"type": "string", "required": True}
        },
        permissionRole="all"
    ),
    ToolDefinitionModel(
        name="request_human_approval",
        description="Submits an action requiring professor human-in-the-loop sign-off.",
        parameters={
            "actionType": {"type": "string", "required": True},
            "courseId": {"type": "string", "required": True},
            "payload": {"type": "object", "required": True}
        },
        permissionRole="professor"
    ),
    ToolDefinitionModel(
        name="score_question_quality",
        description="Assesses inquiry depth across clarity, specificity, and demonstrated effort.",
        parameters={
            "question": {"type": "string", "required": True}
        },
        permissionRole="all"
    ),
    ToolDefinitionModel(
        name="generate_calendar_event",
        description="Synthesizes an .ics calendar payload for a study coach mastery sprint.",
        parameters={
            "title": {"type": "string", "required": True},
            "steps": {"type": "array", "required": True}
        },
        permissionRole="student"
    ),
    ToolDefinitionModel(
        name="aggregate_doubt_trends",
        description="Clusters student doubts to detect systemic curriculum confusion patterns.",
        parameters={
            "courseId": {"type": "string", "required": True}
        },
        permissionRole="professor"
    ),
    ToolDefinitionModel(
        name="draft_announcement",
        description="Generates an announcement addressing common misconceptions.",
        parameters={
            "courseId": {"type": "string", "required": True},
            "topic": {"type": "string", "required": True}
        },
        permissionRole="professor"
    ),
    ToolDefinitionModel(
        name="query_student_memory",
        description="Retrieves inspectable adaptive student memory traits.",
        parameters={
            "studentId": {"type": "string", "required": True},
            "courseId": {"type": "string", "required": True}
        },
        permissionRole="all"
    ),
    ToolDefinitionModel(
        name="update_student_memory",
        description="Records an adaptive learning observation.",
        parameters={
            "studentId": {"type": "string", "required": True},
            "courseId": {"type": "string", "required": True},
            "key": {"type": "string", "required": True},
            "value": {"type": "string", "required": True}
        },
        permissionRole="all"
    ),
]

def get_registered_tools() -> List[ToolDefinitionModel]:
    return TOOLS
