import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Doubt } from '../types/index.js'
import { askTutorWithAI, scoreQuestionQualityWithAI } from '../services/aiService.js'

export async function askDoubt(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { courseId, question } = req.body

  if (!courseId || !question) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'courseId and question are required' })
  }

  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  // Find materials for this course for grounded citations
  const courseMaterials = Array.from(db.materials.values())
    .filter((m) => m.courseId === courseId)
    .map((m) => ({
      id: m.id,
      title: m.title,
      topics: m.indexing.topics,
      description: m.description,
    }))

  // Generate answer and citations via Groq (with heuristic fallback)
  const [tutorRes, quality] = await Promise.all([
    askTutorWithAI({
      courseCode: course.code,
      courseName: course.name,
      question: question.trim(),
      materials: courseMaterials,
    }),
    scoreQuestionQualityWithAI(question.trim()),
  ])

  const doubt: Doubt = {
    id: `doubt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    courseId,
    studentId: user.id,
    question: question.trim(),
    answer: tutorRes.answer,
    citations: tutorRes.citations,
    quality,
    createdAt: new Date().toISOString(),
  }

  db.doubts.set(doubt.id, doubt)
  return res.status(201).json(doubt)
}

export async function listDoubts(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { courseId } = req.params

  let doubts = Array.from(db.doubts.values()).filter((d) => d.courseId === courseId)

  // Filter for student
  if (user.role === 'student') {
    doubts = doubts.filter((d) => d.studentId === user.id)
  }

  return res.json(doubts)
}

export async function clearChat(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { courseId } = req.params

  const marker = {
    id: `marker_${Date.now()}`,
    courseId,
    studentId: user.id,
    clearedAt: new Date().toISOString(),
  }
  db.chatClearMarkers.set(`${courseId}_${user.id}`, marker)
  return res.json({ success: true, clearedAt: marker.clearedAt })
}

