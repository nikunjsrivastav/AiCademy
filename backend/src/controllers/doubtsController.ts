import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Doubt, SourceCitation, QuestionQuality } from '../types/index.js'

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
  const courseMaterials = Array.from(db.materials.values()).filter((m) => m.courseId === courseId)

  const isOutOfScope = /weather|movie|recipe|celebrity|football/i.test(question)

  let answer = ''
  let citations: SourceCitation[] = []

  if (isOutOfScope) {
    answer = `I am your AI course tutor for ${course.code}: ${course.name}. This inquiry falls outside the indexed curriculum and course materials. Please ask questions related to our syllabus or consult Professor Rao.`
  } else {
    answer = `Based on the course materials for ${course.code}, here is the explanation: `
    if (courseMaterials.length > 0) {
      const topMat = courseMaterials[0]
      answer += `Regarding "${question.trim()}", the core concept involves structured principles defined in ${topMat.title}. When balancing or traversing nodes, the tree invariants guarantee logarithmic bounds O(log N).`
      citations.push({
        materialId: topMat.id,
        materialTitle: topMat.title,
        pageNumber: 3,
        snippet: 'The balance factor of any node in an AVL tree is defined as the height difference between left and right subtrees: BF = height(left) - height(right). Invariants require |BF| <= 1.',
        similarity: 0.94,
      })
    } else {
      answer += `The theoretical foundation requires verifying structural invariants and computational complexity constraints as defined in the lecture syllabus.`
    }
  }

  // Question Quality Scoring (B1.4)
  const len = question.trim().length
  const clarity = Math.min(10, Math.max(5, Math.floor(len / 8)))
  const specificity = question.includes('?') && len > 20 ? 9 : 7
  const effort = len > 30 ? 9 : 6
  const qualityScore = Math.round(((clarity + specificity + effort) / 30) * 100)

  const quality: QuestionQuality = {
    score: qualityScore,
    clarity,
    specificity,
    effort,
    feedback: qualityScore >= 80 ? 'Excellent question formulation with clear focus!' : 'Good inquiry. Try adding specific examples or constraints for deeper assistance.',
  }

  const doubt: Doubt = {
    id: `doubt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    courseId,
    studentId: user.id,
    question: question.trim(),
    answer,
    citations,
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

