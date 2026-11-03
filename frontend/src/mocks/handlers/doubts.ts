/**
 * MSW Handlers for Section 5.4 AI-assisted Doubt routes.
 * TODO(backend): replaced by Express controllers in ROADMAP Phase 1.
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb, newId, saveDb } from '../db/store'
import { agentEngine } from '../agents'
import type { ChatClearMarker } from '@/types/domain'

export const doubtHandlers = [
  // POST /api/doubts/ask: ask student doubt
  http.post(api('/doubts/ask'), async ({ request }) => {
    const auth = authenticate(request, ['student'])
    if (!auth.ok) return auth.response
    await latency(120, 280)

    const body = (await request.json().catch(() => ({}))) as any
    const { courseId, question } = body

    if (!courseId || !question) {
      return errorResponse(400, 'VALIDATION_ERROR', 'courseId and question are required')
    }

    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course || !course.studentIds.includes(auth.user.id)) {
      return errorResponse(403, 'FORBIDDEN', 'You must be enrolled in this course to ask doubts')
    }

    // Execute Tutor Agent
    const tutorRun = await agentEngine.startRun(
      'tutor',
      { kind: 'user_action', description: `Doubt inquiry: "${question.slice(0, 40)}..."` },
      { question },
      { actorId: auth.user.id, actorRole: auth.user.role, courseId }
    )

    // Execute Question Quality Agent to score student inquiry
    const qqRun = await agentEngine.startRun(
      'question_quality',
      { kind: 'user_action', description: 'Evaluate inquiry quality' },
      { question },
      { actorId: auth.user.id, actorRole: auth.user.role, courseId }
    )

    // Find the saved doubt in database (saved by tutor tool)
    let doubt = db.doubts.find((d) => d.runId === tutorRun.id)

    if (!doubt) {
      // Fallback doubt record
      doubt = {
        id: newId('dbt'),
        courseId,
        studentId: auth.user.id,
        question,
        answer: (tutorRun.finalOutput as any)?.answer || 'Answer generated based on course slides.',
        citations: (tutorRun.finalOutput as any)?.citations || [],
        qualityScore: (qqRun.finalOutput as any)?.qualityScore || {
          score: 85,
          clarity: 88,
          specificity: 82,
          effort: 85,
          tip: 'Well-framed inquiry! Adding exact code fragments will improve precision.',
        },
        createdAt: new Date().toISOString(),
        confidence: (tutorRun.finalOutput as any)?.confidence ?? 0.92,
        outOfScope: (tutorRun.finalOutput as any)?.outOfScope ?? false,
        runId: tutorRun.id,
      }
      db.doubts.unshift(doubt)
      saveDb()
    } else if (qqRun.finalOutput) {
      doubt.qualityScore = (qqRun.finalOutput as any).qualityScore
      saveDb()
    }

    return HttpResponse.json(doubt, { status: 201 })
  }),

  // GET /api/doubts/course/:courseId: retrieve permitted doubt history
  http.get(api('/doubts/course/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 120)

    const { courseId } = params
    const db = getDb()

    let doubts = db.doubts.filter((d) => d.courseId === courseId)

    if (auth.user.role === 'student') {
      // Filter by student
      doubts = doubts.filter((d) => d.studentId === auth.user.id)

      // Respect chat-clear marker (Section 4: chat-clear marker)
      const marker = db.chatClearMarkers.find(
        (m) => m.courseId === courseId && m.studentId === auth.user.id
      )
      if (marker) {
        doubts = doubts.filter((d) => new Date(d.createdAt) > new Date(marker.clearedAt))
      }
    }

    return HttpResponse.json(doubts)
  }),

  // POST /api/doubts/course/:courseId/clear: create chat-clear marker
  http.post(api('/doubts/course/:courseId/clear'), async ({ request, params }) => {
    const auth = authenticate(request, ['student'])
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { courseId } = params
    const db = getDb()
    const now = new Date().toISOString()

    const existingMarker = db.chatClearMarkers.find(
      (m) => m.courseId === courseId && m.studentId === auth.user.id
    )

    if (existingMarker) {
      existingMarker.clearedAt = now
    } else {
      const marker: ChatClearMarker = {
        id: newId('ccm'),
        studentId: auth.user.id,
        courseId: courseId as string,
        clearedAt: now,
      }
      db.chatClearMarkers.push(marker)
    }

    saveDb()
    return HttpResponse.json({ success: true, clearedAt: now })
  }),
]
