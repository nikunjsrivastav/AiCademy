import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Submission } from '../types/index.js'
import { evaluateSubmissionWithAI } from '../services/aiService.js'
import { uploadFileToStorage } from '../services/storageService.js'
import { vectorEngine } from '../services/vectorService.js'

export async function uploadSubmission(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { assignmentId } = req.params
  const file = req.file
  const body = req.body

  const assignment = db.assignments.get(assignmentId)
  if (!assignment) {
    return res.status(404).json({ code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' })
  }

  const course = await db.getCourse(assignment.courseId)
  if (!course || !course.studentIds.includes(user.id)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'You must be enrolled in this course to submit' })
  }

  const originalName = file?.originalname || body.fileName || 'submission.zip'
  const ext = originalName.split('.').pop()?.toLowerCase() || 'zip'
  const allowedExts = ['pdf', 'docx', 'txt', 'zip']
  if (!allowedExts.includes(ext)) {
    return res.status(400).json({ code: 'UNSUPPORTED_FORMAT', message: `File extension .${ext} is not allowed. Allowed: ${allowedExts.join(', ')}` })
  }

  let fileUrl = body.fileUrl || '/uploads/submissions/file.zip'
  let fileSize = body.fileSize || 50000

  if (file) {
    const uploadRes = await uploadFileToStorage('submissions', file)
    fileUrl = uploadRes.url
    fileSize = uploadRes.fileSize
  }

  const now = new Date()
  const isLate = now.getTime() > new Date(assignment.dueDate).getTime()

  // Existing submissions for versioning
  const existing = Array.from(db.submissions.values()).filter(
    (s) => s.assignmentId === assignmentId && s.studentId === user.id
  )
  const version = existing.length + 1

  // 1. Topic Extraction & Syllabus RAG Retrieval (Option A In-Process Vector Engine)
  const topicQuery = `${assignment.title} ${assignment.description || ''} ${assignment.rubricCriteria.map((c) => c.name).join(' ')}`
  const topicMatches = vectorEngine.search(assignment.courseId, topicQuery, 4)
  const retrievedTopicChunks = topicMatches.map((m) => ({
    materialTitle: m.chunk.materialTitle,
    pageNumber: m.chunk.pageNumber,
    text: m.chunk.text,
    similarity: m.similarity,
  }))

  // 2. Submission content extraction
  let submissionContent = body.submissionContent || body.content || ''
  if (!submissionContent && file && file.buffer) {
    const isText =
      /text|plain|json|javascript|typescript|python|markdown|html/i.test(file.mimetype) ||
      /\.(txt|md|py|js|ts|jsx|tsx|json|c|cpp|java|sql)$/i.test(originalName)
    if (isText) {
      submissionContent = file.buffer.toString('utf-8').slice(0, 8000)
    }
  }
  if (!submissionContent) {
    submissionContent = `[Submitted File: ${originalName} (${Math.round(fileSize / 1024)} KB, format: ${ext}) for assignment "${assignment.title}"]`
  }

  // 3. Evaluate via Groq Academic Professor Persona with Syllabus RAG Grounding
  const aiEval = await evaluateSubmissionWithAI({
    courseCode: course.code,
    courseName: course.name,
    assignmentTitle: assignment.title,
    assignmentDescription: assignment.description,
    rubricCriteria: assignment.rubricCriteria,
    maxMarks: assignment.maxMarks || 100,
    submissionFileName: originalName,
    submissionContent,
    retrievedTopicChunks,
  })

  const submission: Submission = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    assignmentId,
    studentId: user.id,
    courseId: assignment.courseId,
    fileUrl,
    fileName: originalName,
    fileSize,
    extractedTextStatus: 'extracted',
    evaluationStatus: 'graded',
    marks: aiEval.marks,
    feedback: aiEval.reasoning,
    mistakes: aiEval.mistakes,
    suggestions: aiEval.suggestions,
    confidence: aiEval.confidence,
    aiEvaluation: aiEval,
    submittedAt: now.toISOString(),
    isLate,
    version,
  }

  await db.saveSubmission(submission)
  return res.status(201).json(submission)
}

export async function listSubmissions(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { assignmentId } = req.params

  const assignment = db.assignments.get(assignmentId)
  if (!assignment) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Assignment not found' })
  }

  let subs = await db.getSubmissionsByAssignment(assignmentId)

  // Students can only see their own
  if (user.role === 'student') {
    subs = subs.filter((s) => s.studentId === user.id)
  }

  return res.json(subs)
}

export async function scoreSubmission(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { submissionId } = req.params
  const { marks, feedback, notes } = req.body

  if (user.role !== 'professor' && user.role !== 'administrator') {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only faculty can score submissions' })
  }

  const submission = db.submissions.get(submissionId)
  if (!submission) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Submission not found' })
  }

  if (typeof marks === 'number') {
    submission.marks = marks
    submission.overriddenByProfessor = true
  }
  if (feedback) submission.feedback = feedback
  if (notes) submission.professorNotes = notes

  return res.json(submission)
}

