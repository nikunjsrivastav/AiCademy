import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Assignment, RubricCriterion } from '../types/index.js'

export async function listAssignments(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const assignments = Array.from(db.assignments.values()).filter((a) => a.courseId === courseId)
  return res.json(assignments)
}

export async function getAssignment(req: AuthenticatedRequest, res: Response) {
  const { assignmentId } = req.params
  const assignment = db.assignments.get(assignmentId)
  if (!assignment) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Assignment not found' })
  }
  return res.json(assignment)
}

export async function createAssignment(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { courseId, title, description, classification, rubricCriteria, maxMarks, dueDate } = req.body

  if (!courseId || !title || !rubricCriteria || !dueDate) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'courseId, title, rubricCriteria, and dueDate are required' })
  }

  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  if (user.role !== 'administrator' && course.professorId !== user.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only course professor can create assignments' })
  }

  const newAssignment: Assignment = {
    id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    courseId,
    title: title.trim(),
    description: description?.trim() || '',
    classification: classification || 'assignment',
    rubricCriteria: rubricCriteria as RubricCriterion[],
    maxMarks: maxMarks || 100,
    dueDate,
    creatorId: user.id,
    createdAt: new Date().toISOString(),
  }

  db.assignments.set(newAssignment.id, newAssignment)
  return res.status(201).json(newAssignment)
}

export async function deleteAssignment(req: AuthenticatedRequest, res: Response) {
  const { assignmentId } = req.params
  const assignment = db.assignments.get(assignmentId)
  if (!assignment) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Assignment not found' })
  }

  const course = db.courses.get(assignment.courseId)
  if (req.user!.role !== 'administrator' && course?.professorId !== req.user!.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only course professor can delete assignments' })
  }

  db.assignments.delete(assignmentId)
  return res.json({ success: true, message: 'Assignment deleted' })
}

