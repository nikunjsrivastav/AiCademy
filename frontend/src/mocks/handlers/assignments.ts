/**
 * MSW Handlers for Section 5.3 Assignment routes.
 * TODO(backend): replaced by Express controllers in ROADMAP Phase 1.
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb, newId, saveDb } from '../db/store'
import type { Assignment, RubricCriterion } from '@/types/domain'

export const assignmentHandlers = [
  // POST /api/assignments: create an assignment
  http.post(api('/assignments'), async ({ request }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(80, 180)

    const body = (await request.json().catch(() => ({}))) as any
    const { courseId, title, description, rubric, maxMarks, dueDate, classification, topics } = body

    if (!courseId || !title || !dueDate || !rubric) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Missing required fields for assignment')
    }

    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', `Course ${courseId} not found`)
    }

    if (auth.user.role === 'professor' && course.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only create assignments for courses you teach')
    }

    // Validate rubric criteria and assign IDs
    const parsedRubric: RubricCriterion[] = (rubric as any[]).map((r, i) => ({
      id: r.id || `crit_${Date.now().toString(36)}_${i}`,
      title: r.title || `Criterion ${i + 1}`,
      description: r.description || '',
      maxMarks: Number(r.maxMarks) || 0,
    }))

    const calculatedMax = parsedRubric.reduce((acc, c) => acc + c.maxMarks, 0)
    const finalMax = maxMarks || (calculatedMax > 0 ? calculatedMax : 100)

    const newAssignment: Assignment = {
      id: newId('asg'),
      courseId,
      title,
      description: description || '',
      rubric: parsedRubric,
      maxMarks: finalMax,
      dueDate,
      classification: classification || 'assignment',
      createdBy: auth.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topics: topics || [],
    }

    db.assignments.unshift(newAssignment)
    saveDb()

    return HttpResponse.json(newAssignment, { status: 201 })
  }),

  // GET /api/assignments/course/:courseId: list course assignments
  http.get(api('/assignments/course/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { courseId } = params
    const db = getDb()

    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', `Course ${courseId} not found`)
    }

    // Permission check
    if (auth.user.role === 'student' && !course.studentIds.includes(auth.user.id)) {
      return errorResponse(403, 'FORBIDDEN', 'You must be enrolled to view course assignments')
    }

    const courseAssignments = db.assignments.filter((a) => a.courseId === courseId)
    return HttpResponse.json(courseAssignments)
  }),

  // PUT /api/assignments/:assignmentId: update assignment
  http.put(api('/assignments/:assignmentId'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(80, 150)

    const { assignmentId } = params
    const db = getDb()
    const asg = db.assignments.find((a) => a.id === assignmentId)
    if (!asg) {
      return errorResponse(404, 'NOT_FOUND', `Assignment ${assignmentId} not found`)
    }

    const course = db.courses.find((c) => c.id === asg.courseId)
    if (auth.user.role === 'professor' && course?.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only update assignments for your own courses')
    }

    const patch = (await request.json().catch(() => ({}))) as any
    if (patch.title) asg.title = patch.title
    if (patch.description !== undefined) asg.description = patch.description
    if (patch.dueDate) asg.dueDate = patch.dueDate
    if (patch.classification) asg.classification = patch.classification
    if (patch.maxMarks) asg.maxMarks = patch.maxMarks
    if (patch.rubric) asg.rubric = patch.rubric
    if (patch.topics) asg.topics = patch.topics
    asg.updatedAt = new Date().toISOString()

    saveDb()
    return HttpResponse.json(asg)
  }),

  // DELETE /api/assignments/:assignmentId: delete assignment
  http.delete(api('/assignments/:assignmentId'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(80, 150)

    const { assignmentId } = params
    const db = getDb()
    const index = db.assignments.findIndex((a) => a.id === assignmentId)
    if (index === -1) {
      return errorResponse(404, 'NOT_FOUND', `Assignment ${assignmentId} not found`)
    }

    const asg = db.assignments[index]
    const course = db.courses.find((c) => c.id === asg.courseId)
    if (auth.user.role === 'professor' && course?.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only delete assignments for your own courses')
    }

    db.assignments.splice(index, 1)
    // Cascade remove submissions
    db.submissions = db.submissions.filter((s) => s.assignmentId !== assignmentId)
    saveDb()

    return HttpResponse.json({ success: true })
  }),
]
