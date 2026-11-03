/**
 * EXTENSION: agent runtime types from /docs/AGENTIC_DESIGN.md B2 and B4.
 * None of these exist in the original PDF contract.
 */
import type { ID, ISODate, Role } from './domain'

export type AgentName =
  | 'orchestrator'
  | 'ingestion'
  | 'tutor'
  | 'question_quality'
  | 'grader'
  | 'insights'
  | 'study_coach'

export type RunStatus =
  | 'queued'
  | 'running'
  | 'waiting_for_approval'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export type StepType = 'plan' | 'tool_call' | 'observation' | 'reflection' | 'final'
export type StepStatus = 'pending' | 'running' | 'ok' | 'error' | 'skipped'

/** B3 autonomy levels. */
export type AutonomyLevel = 'auto' | 'needs_approval' | 'never'

/** B6 event triggers. */
export type AgentEventType =
  | 'material.uploaded'
  | 'submission.created'
  | 'doubt.asked'
  | 'weekly.tick'
  | 'deadline.approaching'

/** Demo switch (decision D15/D17): deterministic scripted scenarios. */
export type SimulationMode = 'normal' | 'failure' | 'low_confidence'

export interface RunTrigger {
  kind: 'event' | 'user_action' | 'schedule' | 'manual'
  event?: AgentEventType
  description: string
}

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
  /** Estimated from a mock price table (decision D14). */
  estimatedCostUsd: number
}

export interface AgentRun {
  id: ID
  /** B7: request ID propagated through every step. */
  requestId: string
  agent: AgentName
  trigger: RunTrigger
  status: RunStatus
  startedAt: ISODate
  endedAt: ISODate | null
  courseId: ID
  actorId: ID
  parentRunId?: ID
  usage: TokenUsage
  finalOutput: unknown | null
  summary?: string
  error?: string
  simulation: SimulationMode
  stepCount: number
}

export interface AgentStep {
  id: ID
  runId: ID
  index: number
  type: StepType
  content: string
  toolName?: ToolName
  input?: unknown
  output?: unknown
  latencyMs: number
  status: StepStatus
  autonomy?: AutonomyLevel
  createdAt: ISODate
}

export interface AgentRunWithSteps extends AgentRun {
  steps: AgentStep[]
  childRunIds: ID[]
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'edited'
export type ProposedActionKind = 'finalize_grade' | 'publish_announcement'

export interface ProposedAction {
  kind: ProposedActionKind
  targetId: ID
  payload: Record<string, unknown>
}

export interface ApprovalRequest {
  id: ID
  runId: ID
  courseId: ID
  agent: AgentName
  summary: string
  proposedAction: ProposedAction
  /** 0–1, used for bulk approve (decision D11). */
  confidence?: number
  flags?: string[]
  status: ApprovalStatus
  reviewerId?: ID
  decidedAt?: ISODate
  note?: string
  createdAt: ISODate
}

export type ApprovalDecision = 'approve' | 'reject' | 'edit'

export type MemoryScope = 'student' | 'course' | 'professor'

export interface AgentMemory {
  id: ID
  scope: MemoryScope
  /** The user (or course) the memory is about. */
  subjectId: ID
  courseId: ID
  key: string
  value: string
  sourceAgent: AgentName
  updatedAt: ISODate
}

export interface AgentPolicy {
  courseId: ID
  enabledAgents: Record<AgentName, boolean>
  /** Decision D12: only governs provisional feedback visibility; never bypasses grade approval. */
  autoPublish: boolean
  /** Decision D11: grader results below this go to approval. */
  confidenceThreshold: number
  dailyTokenBudget: number
  tokensUsedToday: number
  updatedAt: ISODate
  updatedBy?: ID
}

// ---------------------------------------------------------------------------
// B2 tool registry
// ---------------------------------------------------------------------------
export type ToolName =
  | 'extract_text'
  | 'chunk_and_embed'
  | 'vector_search'
  | 'get_rubric'
  | 'get_submission'
  | 'get_course_materials'
  | 'get_student_progress'
  | 'get_course_analytics'
  | 'save_evaluation'
  | 'save_doubt'
  | 'draft_announcement'
  | 'create_notification'
  | 'request_human_approval'

/** Minimal JSON-Schema-like description, used for display in the trace viewer and docs. */
export interface SchemaDescription {
  type: 'object'
  properties: Record<string, { type: string; description?: string }>
  required?: string[]
}

export interface ToolDefinition {
  name: ToolName
  description: string
  inputSchema: SchemaDescription
  outputSchema: SchemaDescription
  permission: {
    roles: Role[]
    /** Always true in AiCademy: tools may only touch the acting course. */
    courseScoped: boolean
    access: 'read' | 'write'
  }
  autonomy: AutonomyLevel
}
