/**
 * MSW Handlers for Section 5.3 Submission routes.
 * TODO(backend): replaced by Express controllers in ROADMAP Phase 1.
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb, newId, saveDb } from '../db/store'
import { agentEngine } from '../agents'
import type { Submission } from '@/types/domain'

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.zip']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB (Decision D10)

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export const submissionHandlers = [
  // POST /api/submissions/:assignmentId/upload: submit work
  http.post(api('/submissions/:assignmentId/upload'), async ({ request, params }) => {
    const auth = authenticate(request, ['student'])
    if (!auth.ok) return auth.response
    await latency(100, 250)

    const { assignmentId } = params
    const db = getDb()
    const asg = db.assignments.find((a) => a.id === assignmentId)
    if (!asg) {
      return errorResponse(404, 'NOT_FOUND', `Assignment ${assignmentId} not found`)
    }

    const course = db.courses.find((c) => c.id === asg.courseId)
    if (!course || !course.studentIds.includes(auth.user.id)) {
      return errorResponse(403, 'FORBIDDEN', 'You must be enrolled in this course to submit work')
    }

    const body = (await request.json().catch(() => ({}))) as any
    const rawFileName = body.fileName || 'submission.pdf'
    const fileSize = body.fileSize || 500000

    // Extension check (D10)
    const lower = rawFileName.toLowerCase()
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
    if (!hasValidExt) {
      return errorResponse(
        400,
        'INVALID_FILE_TYPE',
        `Unsupported file type. Permitted formats: ${ALLOWED_EXTENSIONS.join(', ')} (D10).`
      )
    }

    // Size check (D10)
    if (fileSize > MAX_FILE_SIZE) {
      return errorResponse(
        400,
        'FILE_TOO_LARGE',
        `File exceeds maximum limit of 10 MB for submissions (D10).`
      )
    }

    const sanitized = sanitizeFileName(rawFileName)
    const now = new Date()
    const isLate = now > new Date(asg.dueDate)

    // Check if previous submission exists (Decision D8: resubmission increments version)
    const existing = db.submissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === auth.user.id
    )

    let submission: Submission
    if (existing) {
      existing.fileName = sanitized
      existing.fileSize = fileSize
      existing.fileUrl = body.fileUrl || `/mock-files/${sanitized}`
      existing.submittedAt = now.toISOString()
      existing.late = isLate
      existing.version += 1
      existing.extractionStatus = 'extracted'
      existing.evaluationStatus = 'evaluating'
      existing.marks = null
      existing.feedback = null
      submission = existing
    } else {
      submission = {
        id: newId('sub'),
        assignmentId: asg.id,
        courseId: asg.courseId,
        studentId: auth.user.id,
        fileUrl: body.fileUrl || `/mock-files/${sanitized}`,
        fileName: sanitized,
        fileSize,
        submittedAt: now.toISOString(),
        late: isLate,
        version: 1,
        extractionStatus: 'extracted',
        evaluationStatus: 'evaluating',
        marks: null,
        feedback: null,
        mistakes: [],
        suggestions: [],
        confidence: null,
      }
      db.submissions.unshift(submission)
    }

    saveDb()

    // Trigger Grader Agent in background
    agentEngine.startRun(
      'grader',
      {
        kind: 'event',
        event: 'submission.created',
        description: `Autonomous evaluation for ${auth.user.name} on ${asg.title}`,
      },
      {
        submissionId: submission.id,
        assignmentId: asg.id,
        studentName: auth.user.name,
        fileName: sanitized,
      },
      {
        actorId: auth.user.id,
        actorRole: auth.user.role,
        courseId: asg.courseId,
        simulation: 'normal',
      }
    )

    return HttpResponse.json(submission, { status: 201 })
  }),

  // GET /api/submissions/:assignmentId: list submissions
  http.get(api('/submissions/:assignmentId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { assignmentId } = params
    const db = getDb()

    let subs = db.submissions.filter((s) => s.assignmentId === assignmentId)

    // Students only see their own submissions
    if (auth.user.role === 'student') {
      subs = subs.filter((s) => s.studentId === auth.user.id)
    }

    return HttpResponse.json(subs)
  }),

  // PUT /api/submissions/:submissionId/score: professor grade / score override
  http.put(api('/submissions/:submissionId/score'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(80, 150)

    const { submissionId } = params
    const db = getDb()
    const sub = db.submissions.find((s) => s.id === submissionId)
    if (!sub) {
      return errorResponse(404, 'NOT_FOUND', `Submission ${submissionId} not found`)
    }

    const course = db.courses.find((c) => c.id === sub.courseId)
    if (auth.user.role === 'professor' && course?.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only grade submissions for your own courses')
    }

    const body = (await request.json().catch(() => ({}))) as any
    if (body.marks === undefined || body.marks === null) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Marks value is required to score submission')
    }

    // Update final approved marks (D9: separate from aiEvaluation)
    sub.marks = Number(body.marks)
    if (body.feedback !== undefined) sub.feedback = body.feedback
    sub.evaluationStatus = 'graded'
    sub.gradedBy = auth.user.id
    sub.gradedAt = new Date().toISOString()

    saveDb()
    return HttpResponse.json(sub)
  }),
]
