/**
 * Announcements & Comments Service calling Section 5.4 routes from /docs/ARCHITECTURE_SOURCE.md.
 * Intercepted by MSW in Phase 0; calls Express backend in Phase 1.
 */
import { http } from './http'
import type { Announcement, CommentWithAuthor } from '@/types/domain'

export interface CreateAnnouncementPayload {
  courseId: string
  title?: string
  content: string
  linkedAssignmentIds?: string[]
}

export interface AddCommentPayload {
  text: string
}

/**
 * Publish a course announcement (Section 5.4: POST /api/announcements).
 */
export async function createAnnouncement(payload: CreateAnnouncementPayload): Promise<Announcement> {
  const res = await http.post<Announcement>('/announcements', payload)
  return res.data
}

/**
 * List announcements for a course with embedded comments (Section 5.4 + Decision D7).
 */
export async function listCourseAnnouncements(courseId: string): Promise<Announcement[]> {
  const res = await http.get<Announcement[]>(`/announcements/course/${courseId}`)
  return res.data
}

/**
 * Add a comment to an announcement (Section 5.4: POST /api/announcements/:announcementId/comments).
 */
export async function addAnnouncementComment(
  announcementId: string,
  payload: AddCommentPayload
): Promise<CommentWithAuthor> {
  const res = await http.post<CommentWithAuthor>(`/announcements/${announcementId}/comments`, payload)
  return res.data
}
