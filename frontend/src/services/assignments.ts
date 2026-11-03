/**
 * Assignment Service calling Section 5.3 routes from /docs/ARCHITECTURE_SOURCE.md.
 * Intercepted by MSW in Phase 0; calls Express backend in Phase 1.
 */
import { http } from './http'
import type { Assignment, AssignmentClassification, RubricCriterion } from '@/types/domain'

export interface CreateAssignmentPayload {
  courseId: string
  title: string
  description: string
  rubric: Omit<RubricCriterion, 'id'>[]
  maxMarks: number
  dueDate: string
  classification: AssignmentClassification
  topics?: string[]
  questionText?: string
  questionFileName?: string
}

export interface UpdateAssignmentPayload extends Partial<CreateAssignmentPayload> {}

/**
 * Create a new assignment with rubric (Section 5.3: POST /api/assignments).
 */
export async function createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
  const res = await http.post<Assignment>('/assignments', payload)
  return res.data
}

/**
 * List assignments for a course (Section 5.3: GET /api/assignments/course/:courseId).
 */
export async function listCourseAssignments(courseId: string): Promise<Assignment[]> {
  const res = await http.get<Assignment[]>(`/assignments/course/${courseId}`)
  return res.data
}

/**
 * Update an assignment (Section 5.3: PUT /api/assignments/:assignmentId).
 */
export async function updateAssignment(
  assignmentId: string,
  payload: UpdateAssignmentPayload
): Promise<Assignment> {
  const res = await http.put<Assignment>(`/assignments/${assignmentId}`, payload)
  return res.data
}

/**
 * Delete an assignment (Section 5.3: DELETE /api/assignments/:assignmentId).
 */
export async function deleteAssignment(assignmentId: string): Promise<{ success: boolean }> {
  const res = await http.delete<{ success: boolean }>(`/assignments/${assignmentId}`)
  return res.data
}
