/**
 * Doubt Service calling Section 5.4 AI-assisted doubt routes from /docs/ARCHITECTURE_SOURCE.md.
 * Intercepted by MSW in Phase 0; calls Express/FastAPI in Phase 1-2.
 */
import { http } from './http'
import type { Doubt } from '@/types/domain'

export interface AskDoubtPayload {
  courseId: string
  question: string
}

/**
 * Submit a student question for course-scoped AI assistance (Section 5.4: POST /api/doubts/ask).
 * Triggers Tutor Agent (agentic RAG) and Question Quality Agent.
 */
export async function askDoubt(payload: AskDoubtPayload): Promise<Doubt> {
  const res = await http.post<Doubt>('/doubts/ask', payload)
  return res.data
}

/**
 * Retrieve permitted doubt history for course (Section 5.4: GET /api/doubts/course/:courseId).
 * Respects student chat-clear markers.
 */
export async function listCourseDoubts(courseId: string): Promise<Doubt[]> {
  const res = await http.get<Doubt[]>(`/doubts/course/${courseId}`)
  return res.data
}

/**
 * Create a chat-clear marker to visually reset conversation history (Section 5.4: POST /api/doubts/course/:courseId/clear).
 */
export async function clearChatHistory(courseId: string): Promise<{ success: boolean; clearedAt: string }> {
  const res = await http.post<{ success: boolean; clearedAt: string }>(`/doubts/course/${courseId}/clear`)
  return res.data
}
