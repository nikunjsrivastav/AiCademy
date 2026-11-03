import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Material, MaterialType } from '../types/index.js'

export async function listMaterials(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const materials = Array.from(db.materials.values()).filter((m) => m.courseId === courseId)
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

  const course = db.courses.get(courseId)
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

  const newMaterial: Material = {
    id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    courseId,
    title,
    description,
    type: matType,
    fileUrl: file ? `/uploads/materials/${file.filename}` : (body.fileUrl || '/uploads/materials/doc.pdf'),
    fileName: originalName,
    fileSize: file ? file.size : (body.fileSize || 102400),
    mimeType: file ? file.mimetype : 'application/pdf',
    uploaderId: user.id,
    indexing: {
      status: 'indexed',
      chunkCount: Math.max(12, Math.floor((file?.size || 50000) / 1500)),
      chunkSize: 800,
      topics: [title.split(' ')[0] || 'Core', 'Concepts', 'Course Material'],
      lastIndexedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  }

  db.materials.set(newMaterial.id, newMaterial)
  return res.status(201).json(newMaterial)
}

export async function deleteMaterial(req: AuthenticatedRequest, res: Response) {
  const { materialId } = req.params
  const material = db.materials.get(materialId)
  if (!material) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Material not found' })
  }

  const course = db.courses.get(material.courseId)
  if (req.user!.role !== 'administrator' && course?.professorId !== req.user!.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only course professor can delete materials' })
  }

  db.materials.delete(materialId)
  return res.json({ success: true, message: 'Material deleted successfully' })
}

export async function reindexMaterial(req: AuthenticatedRequest, res: Response) {
  const { materialId } = req.params
  const material = db.materials.get(materialId)
  if (!material) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Material not found' })
  }

  material.indexing.status = 'indexed'
  material.indexing.lastIndexedAt = new Date().toISOString()
  return res.json(material)
}

