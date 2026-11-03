import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Announcement, Comment } from '../types/index.js'

export async function listAnnouncements(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const announcements = await db.getAnnouncementsByCourse(courseId)
  return res.json(announcements)
}

export async function createAnnouncement(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { courseId, title, content, pinned, linkedAssignmentId } = req.body

  if (!courseId || !title || !content) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'courseId, title, and content are required' })
  }

  const course = await db.getCourse(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  if (user.role !== 'administrator' && course.professorId !== user.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only course professor can post announcements' })
  }

  const announcement: Announcement = {
    id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    courseId,
    authorId: user.id,
    title: title.trim(),
    content: content.trim(),
    pinned: !!pinned,
    linkedAssignmentId,
    comments: [],
    createdAt: new Date().toISOString(),
  }

  await db.saveAnnouncement(announcement)
  return res.status(201).json(announcement)
}

export async function addComment(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { announcementId } = req.params
  const { content } = req.body

  if (!content || !content.trim()) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Comment content is required' })
  }

  const announcement = await db.getAnnouncement(announcementId)
  if (!announcement) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Announcement not found' })
  }

  const comment: Comment = {
    id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    announcementId,
    userId: user.id,
    authorName: user.name,
    authorRole: user.role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  }

  announcement.comments = [...(announcement.comments || []), comment]
  await db.saveAnnouncement(announcement)

  return res.status(201).json(comment)
}

