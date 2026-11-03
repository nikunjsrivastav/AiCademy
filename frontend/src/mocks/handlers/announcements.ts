/**
 * MSW Handlers for Section 5.4 Announcements & Comments.
 * TODO(backend): replaced by Express controllers in ROADMAP Phase 1.
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb, newId, saveDb } from '../db/store'
import type { Announcement, CommentWithAuthor } from '@/types/domain'

export const announcementHandlers = [
  // POST /api/announcements: publish course announcement
  http.post(api('/announcements'), async ({ request }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(80, 150)

    const body = (await request.json().catch(() => ({}))) as any
    const { courseId, title, content, linkedAssignmentIds } = body

    if (!courseId || !content) {
      return errorResponse(400, 'VALIDATION_ERROR', 'courseId and content are required')
    }

    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', `Course ${courseId} not found`)
    }

    const newAnnouncement: Announcement = {
      id: newId('anc'),
      courseId,
      authorId: auth.user.id,
      title: title || 'Announcement',
      content,
      linkedAssignmentIds: linkedAssignmentIds || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
    }

    db.announcements.unshift(newAnnouncement)
    saveDb()

    return HttpResponse.json(newAnnouncement, { status: 201 })
  }),

  // GET /api/announcements/course/:courseId: list announcements with comments embedded (D7)
  http.get(api('/announcements/course/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { courseId } = params
    const db = getDb()

    const list = db.announcements.filter((a) => a.courseId === courseId)

    // Embed author info into comments
    const enriched = list.map((a) => {
      const comments = (a.comments || []).map((c: any) => {
        const author = db.users.find((u) => u.id === c.userId)
        return {
          ...c,
          author: author
            ? { id: author.id, name: author.name, role: author.role, profile: author.profile }
            : { id: c.userId, name: 'User', role: 'student' as const, profile: {} },
        }
      })
      return {
        ...a,
        comments,
      }
    })

    return HttpResponse.json(enriched)
  }),

  // POST /api/announcements/:announcementId/comments: add a comment
  http.post(api('/announcements/:announcementId/comments'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(60, 140)

    const { announcementId } = params
    const body = (await request.json().catch(() => ({}))) as any
    const { text } = body

    if (!text || !text.trim()) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Comment text cannot be empty')
    }

    const db = getDb()
    const anc = db.announcements.find((a) => a.id === announcementId)
    if (!anc) {
      return errorResponse(404, 'NOT_FOUND', `Announcement ${announcementId} not found`)
    }

    if (!anc.comments) anc.comments = []

    const commentId = newId('cmt')
    const now = new Date().toISOString()
    const commentWithAuthor: CommentWithAuthor = {
      id: commentId,
      announcementId: anc.id,
      userId: auth.user.id,
      text: text.trim(),
      createdAt: now,
      updatedAt: now,
      author: {
        id: auth.user.id,
        name: auth.user.name,
        role: auth.user.role,
        profile: auth.user.profile,
      },
    }

    anc.comments = anc.comments || []
    anc.comments.push(commentWithAuthor)
    saveDb()

    return HttpResponse.json(commentWithAuthor, { status: 201 })
  }),
]
