/**
 * Submission Service calling Section 5.3 routes from /docs/ARCHITECTURE_SOURCE.md.
 * Intercepted by MSW in Phase 0; calls Express backend in Phase 1.
 */
import { http } from './http'
import type { Submission } from '@/types/domain'

export interface UploadSubmissionPayload {
  fileName: string
  fileSize: number
  fileUrl?: string
  mimeType?: string
  file?: File
  submissionContent?: string
}

export interface ScoreSubmissionPayload {
  marks: number
  feedback?: string
}

/**
 * Submit student work for an assignment (Section 5.3: POST /api/submissions/:assignmentId/upload).
 * Triggers Grader Agent evaluation in background.
 */
export async function uploadSubmission(
  assignmentId: string,
  payload: UploadSubmissionPayload
): Promise<Submission> {
  if (typeof window !== 'undefined' && payload.file instanceof File) {
    const formData = new FormData()
    formData.append('file', payload.file)
    formData.append('fileName', payload.fileName)
    formData.append('fileSize', String(payload.fileSize))
    if (payload.fileUrl) formData.append('fileUrl', payload.fileUrl)
    if (payload.mimeType) formData.append('mimeType', payload.mimeType)
    if (payload.submissionContent) formData.append('submissionContent', payload.submissionContent)
    const res = await http.post<Submission>(`/submissions/${assignmentId}/upload`, formData)
    return res.data
  }

  const res = await http.post<Submission>(`/submissions/${assignmentId}/upload`, payload)
  return res.data
}

/**
 * Get submissions for an assignment (Section 5.3: GET /api/submissions/:assignmentId).
 * Students see only their own submission; professors see all submissions.
 */
export async function listAssignmentSubmissions(assignmentId: string): Promise<Submission[]> {
  const res = await http.get<Submission[]>(`/submissions/${assignmentId}`)
  return res.data
}

/**
 * Update / override score for a submission (Section 5.3: PUT /api/submissions/:submissionId/score).
 * Updates marks and feedback while preserving separate aiEvaluation (decision D9).
 */
export async function scoreSubmission(
  submissionId: string,
  payload: ScoreSubmissionPayload
): Promise<Submission> {
  const res = await http.put<Submission>(`/submissions/${submissionId}/score`, payload)
  return res.data
}
