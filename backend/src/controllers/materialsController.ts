import type { Response } from 'express'
import fs from 'node:fs'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Material, MaterialType } from '../types/index.js'
import { uploadFileToStorage } from '../services/storageService.js'
import { vectorEngine } from '../services/vectorService.js'
import { extractTextFromBuffer } from '../services/extractionService.js'

export async function listMaterials(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const materials = await db.getMaterialsByCourse(courseId)
  return res.json(materials)
}

export async function uploadMaterial(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const file = req.file
  const body = req.body

  const courseId = body.courseId
  const title = body.title || file?.originalname || 'Untitled Document'
  const description = body.description || ''

  if (!courseId) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'courseId is required' })
  }

  const course = await db.getCourse(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  if (user.role !== 'administrator' && course.professorId !== user.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only the course professor can upload materials' })
  }

  // Derive material type
  const originalName = file?.originalname || body.fileName || 'document.pdf'
  const ext = originalName.split('.').pop()?.toLowerCase() || 'pdf'
  const allowedExts = ['pdf', 'docx', 'pptx', 'txt', 'md']
  if (!allowedExts.includes(ext)) {
    return res.status(400).json({ code: 'UNSUPPORTED_FORMAT', message: `File extension .${ext} is not supported. Allowed: ${allowedExts.join(', ')}` })
  }

  let matType: MaterialType = 'document'
  if (ext === 'pdf') matType = 'pdf'
  else if (ext === 'pptx') matType = 'slides'
  else if (ext === 'txt' || ext === 'md') matType = 'notes'

  let fileUrl = body.fileUrl || '/uploads/materials/doc.pdf'
  let fileSize = body.fileSize || 102400
  let mimeType = 'application/pdf'

  if (file) {
    const uploadRes = await uploadFileToStorage('materials', file)
    fileUrl = uploadRes.url
    fileSize = uploadRes.fileSize
    mimeType = uploadRes.mimeType
  }

  let extractedTopics = [title.split(' ')[0] || 'Core', 'Concepts', 'Course Material']
  let extractedDoc = null

  if (file) {
    const fileBuffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null)
    if (fileBuffer) {
      try {
        extractedDoc = await extractTextFromBuffer(fileBuffer, originalName, mimeType)
        if (extractedDoc.topics.length > 0) {
          extractedTopics = extractedDoc.topics
        }
      } catch (err) {
        console.warn(`[Materials] Topic extraction warning on ${originalName}:`, err)
      }
    }
  }

  const newMaterial: Material = {
    id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    courseId,
    title,
    description: description || (extractedDoc?.text ? extractedDoc.text.slice(0, 300) : ''),
    type: matType,
    fileUrl,
    fileName: originalName,
    fileSize,
    mimeType,
    uploaderId: user.id,
    indexing: {
      status: 'indexed',
      chunkCount: Math.max(8, extractedDoc?.pageCount ? extractedDoc.pageCount * 4 : Math.floor(fileSize / 1500)),
      chunkSize: 800,
      topics: extractedTopics,
      lastIndexedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  }

  await db.saveMaterial(newMaterial)

  // Index into embedded in-process vector engine (Option A)
  vectorEngine.indexMaterial(
    courseId,
    newMaterial.id,
    newMaterial.title,
    newMaterial.indexing.topics,
    extractedDoc?.text || newMaterial.description
  )

  return res.status(201).json(newMaterial)
}

export async function deleteMaterial(req: AuthenticatedRequest, res: Response) {
  const { materialId } = req.params
  const material = await db.getMaterial(materialId)
  if (!material) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Material not found' })
  }

  const course = await db.getCourse(material.courseId)
  if (req.user!.role !== 'administrator' && course?.professorId !== req.user!.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only course professor can delete materials' })
  }

  // Remove from in-process vector engine
  vectorEngine.removeMaterial(material.courseId, materialId)

  await db.deleteMaterial(materialId)
  return res.json({ success: true, message: 'Material deleted successfully' })
}

export async function reindexMaterial(req: AuthenticatedRequest, res: Response) {
  const { materialId } = req.params
  const material = await db.getMaterial(materialId)
  if (!material) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Material not found' })
  }

  material.indexing.status = 'indexed'
  material.indexing.lastIndexedAt = new Date().toISOString()

  await db.saveMaterial(material)

  // Re-index into embedded vector engine
  vectorEngine.indexMaterial(
    material.courseId,
    material.id,
    material.title,
    material.indexing.topics,
    material.description
  )

  return res.json({
    message: 'Material reindexed successfully',
    material,
    ...material,
  })
}

