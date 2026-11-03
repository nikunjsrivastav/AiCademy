/**
 * EXTENSION: Agent Service calling /api/agents/* routes from /docs/AGENTIC_DESIGN.md B5.
 * Intercepted by MSW mock handlers in Phase 0; calls Express/FastAPI in Phase 4.
 */
import { http } from './http'
import type {
  AgentMemory,
  AgentName,
  AgentPolicy,
  AgentRun,
  AgentRunWithSteps,
  ApprovalDecision,
  ApprovalRequest,
  RunTrigger,
  SimulationMode,
  ToolDefinition,
} from '@/types/agents'

export interface StartRunPayload {
  agent: AgentName
  trigger: RunTrigger
  input: any
  courseId: string
  simulation?: SimulationMode
}

export interface DecideApprovalPayload {
  decision: ApprovalDecision
  note?: string
  payloadOverride?: Record<string, unknown>
}

/**
 * Start an agent execution run.
 */
export async function startAgentRun(payload: StartRunPayload): Promise<AgentRun> {
  const res = await http.post<AgentRun>('/agents/runs', payload)
  return res.data
}

/**
 * List agent runs, optionally filtered by course.
 */
export async function listAgentRuns(courseId?: string): Promise<AgentRun[]> {
  const params = courseId ? { courseId } : {}
  const res = await http.get<AgentRun[]>('/agents/runs', { params })
  return res.data
}

/**
 * Retrieve an agent run along with its step trace.
 */
export async function getAgentRunTrace(runId: string): Promise<AgentRunWithSteps> {
  const res = await http.get<AgentRunWithSteps>(`/agents/runs/${runId}`)
  return res.data
}

/**
 * Cancel a running or waiting agent run.
 */
export async function cancelAgentRun(runId: string): Promise<AgentRun> {
  const res = await http.post<AgentRun>(`/agents/runs/${runId}/cancel`)
  return res.data
}

/**
 * List pending approvals for professor.
 */
export async function listApprovals(courseId?: string): Promise<ApprovalRequest[]> {
  const params = courseId ? { courseId } : {}
  const res = await http.get<ApprovalRequest[]>('/agents/approvals', { params })
  return res.data
}

/**
 * Approve, reject, or edit an approval request.
 */
export async function decideApproval(
  approvalId: string,
  payload: DecideApprovalPayload
): Promise<ApprovalRequest> {
  const res = await http.post<ApprovalRequest>(`/agents/approvals/${approvalId}/decide`, payload)
  return res.data
}

/**
 * Retrieve agent policy for a course.
 */
export async function getAgentPolicy(courseId: string): Promise<AgentPolicy> {
  const res = await http.get<AgentPolicy>(`/agents/policy/${courseId}`)
  return res.data
}

/**
 * Update agent policy for a course.
 */
export async function updateAgentPolicy(
  courseId: string,
  patch: Partial<AgentPolicy>
): Promise<AgentPolicy> {
  const res = await http.put<AgentPolicy>(`/agents/policy/${courseId}`, patch)
  return res.data
}

/**
 * List inspectable agent memories for a course.
 */
export async function listAgentMemories(courseId: string): Promise<AgentMemory[]> {
  const res = await http.get<AgentMemory[]>(`/agents/memory/${courseId}`)
  return res.data
}

/**
 * Delete an agent memory (user privacy right per D16).
 */
export async function deleteAgentMemory(memoryId: string): Promise<{ success: boolean }> {
  const res = await http.delete<{ success: boolean }>(`/agents/memory/${memoryId}`)
  return res.data
}

/**
 * Get personalized study plan for student.
 */
export async function getStudyPlan(courseId: string): Promise<any> {
  const res = await http.get<any>(`/agents/study-plan/${courseId}`)
  return res.data
}

/**
 * Get teaching insights for professor.
 */
export async function getCourseInsights(courseId: string): Promise<any> {
  const res = await http.get<any>(`/agents/insights/${courseId}`)
  return res.data
}

/**
 * List all registered tool definitions from B2.
 */
export async function listRegisteredTools(): Promise<ToolDefinition[]> {
  const res = await http.get<ToolDefinition[]>('/agents/tools')
  return res.data
}
