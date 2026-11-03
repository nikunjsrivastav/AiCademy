import type { Response } from 'express'
import fs from 'node:fs'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Submission } from '../types/index.js'
import { evaluateSubmissionWithAI } from '../services/aiService.js'
import { uploadFileToStorage } from '../services/storageService.js'
import { vectorEngine } from '../services/vectorService.js'
import { extractTextFromBuffer } from '../services/extractionService.js'

export async function uploadSubmission(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { assignmentId } = req.params
  const file = req.file
  const body = req.body

  const assignment = await db.getAssignment(assignmentId)
  if (!assignment) {
    return res.status(404).json({ code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' })
  }

  const course = await db.getCourse(assignment.courseId)
  if (!course || !course.studentIds.includes(user.id)) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'You must be enrolled in this course to submit' })
  }

  const originalName = file?.originalname || body.fileName || 'submission.zip'
  const ext = originalName.split('.').pop()?.toLowerCase() || 'zip'
  const allowedExts = ['pdf', 'docx', 'txt', 'zip', 'py', 'js', 'ts', 'java', 'cpp', 'c', 'md', 'json', 'sql', 'html', 'css', 'go', 'rs']
  if (!allowedExts.includes(ext)) {
    return res.status(400).json({ code: 'UNSUPPORTED_FORMAT', message: `File extension .${ext} is not allowed. Allowed: ${allowedExts.join(', ')}` })
  }

  // 1. Capture file buffer immediately from memoryStorage or disk before any storage side-effects
  const fileBuffer = file?.buffer || (file?.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null)
  const actualSize = file?.size || (fileBuffer ? fileBuffer.length : body.fileSize || 50000)

  let fileUrl = body.fileUrl || '/uploads/submissions/file.zip'
  let fileSize = actualSize

  if (file) {
    try {
      const uploadRes = await uploadFileToStorage('submissions', file)
      fileUrl = uploadRes.url
      fileSize = uploadRes.fileSize || actualSize
    } catch (storageErr) {
      console.warn('[Submissions] Storage upload warning:', storageErr)
    }
  }

  const now = new Date()
  const isLate = now.getTime() > new Date(assignment.dueDate).getTime()

  // Existing submissions for versioning from Atlas
  const existingList = await db.getSubmissionsByAssignment(assignmentId)
  const existing = existingList.filter((s) => s.studentId === user.id)
  const version = existing.length + 1

  // 2. Comprehensive submission content & text extraction
  let submissionContent = (body.submissionContent || body.content || '').trim()
  let extractedDoc: any = null

  if (fileBuffer && fileBuffer.length > 0) {
    try {
      extractedDoc = await extractTextFromBuffer(fileBuffer, originalName, file?.mimetype)
      if (extractedDoc && extractedDoc.text && extractedDoc.text.trim().length > 0) {
        submissionContent = extractedDoc.text.trim()
      }
      console.log(`[Submissions] Extracted ${extractedDoc?.wordCount || 0} words from ${originalName} (format: ${extractedDoc?.format})`)
    } catch (extractErr) {
      console.warn(`[Submissions] Extraction warning on ${originalName}:`, extractErr)
    }
  }

  // Direct UTF-8 buffer decoding fallback for text, scripts, and source files (non-PDF)
  if ((!submissionContent || submissionContent.length < 5) && fileBuffer && fileBuffer.length > 0) {
    try {
      const directText = fileBuffer.toString('utf-8').trim()
      if (directText.length > 0 && !directText.startsWith('%PDF')) {
        submissionContent = directText
        console.log(`[Submissions] Used direct UTF-8 buffer decoding (${submissionContent.length} chars) for ${originalName}`)
      }
    } catch (utf8Err) {
      console.warn(`[Submissions] Direct UTF-8 decode warning on ${originalName}:`, utf8Err)
    }
  }

  if (!submissionContent) {
    submissionContent = `[Submitted File: ${originalName} (${Math.round(fileSize / 1024)} KB, format: ${ext}) for assignment "${assignment.title}"]`
  }

  // 2. Topic Search & Syllabus RAG Retrieval (Option A In-Process Vector Engine)
  const courseMaterials = await db.getMaterialsByCourse(assignment.courseId)
  if (vectorEngine.getChunkCount(assignment.courseId) === 0 && courseMaterials.length > 0) {
    courseMaterials.forEach((m) =>
      vectorEngine.indexMaterial(
        assignment.courseId,
        m.id,
        m.title,
        m.indexing?.topics || [],
        m.description
      )
    )
  }

  const criteriaList = assignment.rubricCriteria || (assignment as any).rubric || []
  const criteriaText = criteriaList.map((c: any) => c.name || c.title || '').join(' ')
  const extractedKeywords = extractedDoc?.topics?.join(' ') || ''
  const snippet = submissionContent.slice(0, 300)
  const topicQuery = `${assignment.title} ${assignment.description || ''} ${extractedKeywords} ${snippet}`
  const topicMatches = vectorEngine.search(assignment.courseId, topicQuery, 4)
  const retrievedTopicChunks = topicMatches.map((m) => ({
    materialTitle: m.chunk.materialTitle,
    pageNumber: m.chunk.pageNumber,
    text: m.chunk.text,
    similarity: m.similarity,
  }))

  // 3. Evaluate via Groq Academic Professor Persona with Syllabus RAG Grounding
  const aiEval = await evaluateSubmissionWithAI({
    courseCode: course.code,
    courseName: course.name,
    assignmentTitle: assignment.title,
    assignmentDescription: assignment.description,
    rubricCriteria: criteriaList.map((c: any) => ({
      id: c.id,
      name: c.name || c.title || 'Criterion',
      description: c.description || '',
      weight: c.weight || 1,
      maxScore: c.maxScore || c.maxMarks || 25,
    })),
    maxMarks: assignment.maxMarks || 100,
    submissionFileName: originalName,
    submissionContent,
    retrievedTopicChunks,
  })

  // Normalize aiEvaluation so both totalMarks and marks exist
  const normalizedAiEval = {
    ...aiEval,
    totalMarks: aiEval.marks,
  }

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
    aiEvaluation: normalizedAiEval as any,
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

  const assignment = await db.getAssignment(assignmentId)
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

  const submission = await db.getSubmission(submissionId)
  if (!submission) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Submission not found' })
  }

  if (typeof marks === 'number') {
    submission.marks = marks
    submission.overriddenByProfessor = true
  }
  if (feedback) submission.feedback = feedback
  if (notes) submission.professorNotes = notes

  // Persist score override permanently to MongoDB Atlas
  await db.saveSubmission(submission)

  return res.json(submission)
}

