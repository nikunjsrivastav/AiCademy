/**
 * MSW handlers for /api/materials routes (PDF Section 5.2 + EXTENSIONS).
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb, saveDb, newId } from '../db/store'
import type { Material, MaterialType } from '@/types/domain'
import type { UpdateMaterialRequest, ReindexMaterialResponse } from '@/types/api'

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt', '.md']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB (decision D10)

function sanitizeFileName(name: string): string {
  // Remove path traversal and bad characters
  const base = name.replace(/^.*[\\/]/, '')
  return base.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function detectMaterialType(fileName: string): MaterialType {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) return 'slides'
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'document'
  if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'notes'
  return 'document'
}

function detectMimeType(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) return 'application/pdf'
  if (lower.endsWith('.pptx')) {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (lower.endsWith('.md')) return 'text/markdown'
  if (lower.endsWith('.txt')) return 'text/plain'
  return 'application/octet-stream'
}

function extractMockTopics(title: string): string[] {
  const words = title
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['lecture', 'notes', 'part', 'chapter', 'slides'].includes(w.toLowerCase()))
  if (words.length === 0) return ['Core Concepts', 'Foundations']
  return words.slice(0, 4)
}

export const materialHandlers = [
  // GET /api/materials/course/:courseId - List materials for a course
  http.get(api('/materials/course/:courseId'), async ({ request, params }) => {
    await latency(150, 300)
    const auth = authenticate(request)
    if (!auth.ok) return auth.response

    const courseId = params.courseId as string
    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', 'Course not found.')
    }

    // Permission check
    const isEnrolled = course.studentIds.includes(auth.user.id)
    const isOwner = course.professorId === auth.user.id
    const isAdmin = auth.user.role === 'administrator'
    if (!isEnrolled && !isOwner && !isAdmin) {
      return errorResponse(403, 'FORBIDDEN', 'You do not have access to materials in this course.')
    }

    const materials = db.materials
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return HttpResponse.json<Material[]>(materials)
  }),

  // POST /api/materials - Upload and register course material
  http.post(api('/materials'), async ({ request }) => {
    await latency(300, 600)
    const auth = authenticate(request, ['professor'])
    if (!auth.ok) return auth.response

    let courseId = ''
    let title = ''
    let description = ''
    let fileName = 'document.pdf'
    let fileSize = 1_024_000
    let mimeType = 'application/pdf'

    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      courseId = (formData.get('courseId') as string) || ''
      title = (formData.get('title') as string) || ''
      description = (formData.get('description') as string) || ''
      const file = formData.get('file')
      if (file && typeof file === 'object' && 'name' in file) {
        fileName = file.name
        fileSize = file.size
        mimeType = file.type || detectMimeType(file.name)
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>
      courseId = String(body.courseId || '')
      title = String(body.title || '')
      description = String(body.description || '')
      if (body.fileName) fileName = String(body.fileName)
      if (body.fileSize) fileSize = Number(body.fileSize)
    }

    if (!courseId) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Course ID is required.')
    }
    if (!title.trim()) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Material title is required.')
    }

    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', 'Course not found.')
    }
    if (course.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only upload materials to your own courses.')
    }

    // Validate extension & size (decision D10)
    const sanitizedName = sanitizeFileName(fileName)
    const ext = sanitizedName.substring(sanitizedName.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return errorResponse(
        400,
        'INVALID_FILE_TYPE',
        `File extension "${ext}" is not supported. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}.`,
      )
    }
    if (fileSize > MAX_FILE_SIZE) {
      return errorResponse(
        400,
        'FILE_TOO_LARGE',
        `File size (${(fileSize / (1024 * 1024)).toFixed(1)} MB) exceeds the 20 MB limit.`,
      )
    }

    const matType = detectMaterialType(sanitizedName)
    const chunks = Math.max(6, Math.round(fileSize / 65_000))
    const topics = extractMockTopics(title)
    const now = new Date().toISOString()

    const newMaterial: Material = {
      id: newId('mat'),
      courseId,
      title: title.trim(),
      description: description.trim(),
      type: matType,
      fileName: sanitizedName,
      fileSize,
      mimeType,
      fileUrl: `/mock-files/${sanitizedName}`,
      uploadedBy: auth.user.id,
      createdAt: now,
      updatedAt: now,
      indexing: {
        status: 'indexed',
        chunkCount: chunks,
        topics,
        lastIndexedAt: now,
      },
    }

    db.materials.unshift(newMaterial)
    saveDb()

    return HttpResponse.json<Material>(newMaterial, { status: 201 })
  }),

  // PUT /api/materials/:materialId - Manage material record
  http.put(api('/materials/:materialId'), async ({ request, params }) => {
    await latency(150, 300)
    const auth = authenticate(request, ['professor'])
    if (!auth.ok) return auth.response

    const materialId = params.materialId as string
    const db = getDb()
    const material = db.materials.find((m) => m.id === materialId)
    if (!material) {
      return errorResponse(404, 'NOT_FOUND', 'Material not found.')
    }

    const course = db.courses.find((c) => c.id === material.courseId)
    if (!course || course.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only modify materials for your own courses.')
    }

    const body = (await request.json()) as UpdateMaterialRequest
    if (body.title !== undefined) material.title = body.title.trim()
    if (body.description !== undefined) material.description = body.description.trim()
    material.updatedAt = new Date().toISOString()

    saveDb()
    return HttpResponse.json<Material>(material)
  }),

  // DELETE /api/materials/:materialId - Delete material record
  http.delete(api('/materials/:materialId'), async ({ request, params }) => {
    await latency(150, 300)
    const auth = authenticate(request, ['professor'])
    if (!auth.ok) return auth.response

    const materialId = params.materialId as string
    const db = getDb()
    const materialIdx = db.materials.findIndex((m) => m.id === materialId)
    if (materialIdx === -1) {
      return errorResponse(404, 'NOT_FOUND', 'Material not found.')
    }

    const material = db.materials[materialIdx]
    const course = db.courses.find((c) => c.id === material.courseId)
    if (!course || course.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only delete materials from your own courses.')
    }

    db.materials.splice(materialIdx, 1)
    saveDb()

    return HttpResponse.json<{ success: boolean; id: string }>({
      success: true,
      id: materialId,
    })
  }),

  // EXTENSION: POST /api/materials/:materialId/reindex - Request vector reindexing
  http.post(api('/materials/:materialId/reindex'), async ({ request, params }) => {
    await latency(400, 800)
    const auth = authenticate(request, ['professor'])
    if (!auth.ok) return auth.response

    const materialId = params.materialId as string
    const db = getDb()
    const material = db.materials.find((m) => m.id === materialId)
    if (!material) {
      return errorResponse(404, 'NOT_FOUND', 'Material not found.')
    }

    const course = db.courses.find((c) => c.id === material.courseId)
    if (!course || course.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only reindex materials in your own courses.')
    }

    // Refresh indexing details
    material.indexing.status = 'indexed'
    material.indexing.lastIndexedAt = new Date().toISOString()
    material.indexing.chunkCount = Math.max(material.indexing.chunkCount, 12)
    material.updatedAt = new Date().toISOString()
    saveDb()

    return HttpResponse.json<ReindexMaterialResponse>({
      message: `Vector index successfully refreshed for "${material.title}". ${material.indexing.chunkCount} chunks available for RAG search.`,
      material,
    })
  }),
]
