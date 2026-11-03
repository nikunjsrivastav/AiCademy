import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Assignment, RubricCriterion } from '../types/index.js'

function enrichAssignment(asg: Assignment) {
  const criteria = asg.rubricCriteria || (asg as any).rubric || []
  const rubric = criteria.map((c: any) => ({
    id: c.id,
    name: c.name || c.title || 'Criterion',
    title: c.title || c.name || 'Criterion',
    description: c.description || '',
    maxMarks: c.maxScore || c.maxMarks || 25,
    maxScore: c.maxScore || c.maxMarks || 25,
    weight: c.weight || 1,
  }))

  return {
    ...asg,
    rubricCriteria: rubric,
    rubric,
  }
}

export async function listAssignments(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const assignments = await db.getAssignmentsByCourse(courseId)
  return res.json(assignments.map(enrichAssignment))
}

export async function getAssignment(req: AuthenticatedRequest, res: Response) {
  const { assignmentId } = req.params
  const assignment = await db.getAssignment(assignmentId)
  if (!assignment) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Assignment not found' })
  }
  return res.json(enrichAssignment(assignment))
}

export async function createAssignment(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const {
    courseId,
    title,
    description,
    classification,
    rubricCriteria,
    rubric,
    maxMarks,
    dueDate,
  } = req.body

  const criteriaInput = rubricCriteria || rubric
  if (!courseId || !title || !criteriaInput || !dueDate) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'courseId, title, rubricCriteria (or rubric), and dueDate are required',
    })
  }

  const course = await db.getCourse(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  if (user.role !== 'administrator' && course.professorId !== user.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only course professor can create assignments' })
  }

  const rawList = Array.isArray(criteriaInput) ? criteriaInput : []
  const normalizedCriteria: RubricCriterion[] = rawList.map((c: any, idx: number) => ({
    id: c.id || `crit_${idx + 1}`,
    name: c.name || c.title || `Criterion ${idx + 1}`,
    description: c.description || '',
    weight: typeof c.weight === 'number' ? c.weight : 1,
    maxScore: typeof c.maxScore === 'number' ? c.maxScore : (typeof c.maxMarks === 'number' ? c.maxMarks : 25),
  }))

  const newAssignment: Assignment = {
    id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    courseId,
    title: title.trim(),
    description: description?.trim() || '',
    classification: classification || 'assignment',
    rubricCriteria: normalizedCriteria,
    maxMarks: maxMarks || 100,
    dueDate,
    creatorId: user.id,
    createdAt: new Date().toISOString(),
  }

  await db.saveAssignment(newAssignment)
  return res.status(201).json(enrichAssignment(newAssignment))
}

export async function deleteAssignment(req: AuthenticatedRequest, res: Response) {
  const { assignmentId } = req.params
  const assignment = await db.getAssignment(assignmentId)
  if (!assignment) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Assignment not found' })
  }

  const course = await db.getCourse(assignment.courseId)
  if (req.user!.role !== 'administrator' && course?.professorId !== req.user!.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only course professor can delete assignments' })
  }

  await db.deleteAssignment(assignmentId)
  return res.json({ success: true, message: 'Assignment deleted' })
}

