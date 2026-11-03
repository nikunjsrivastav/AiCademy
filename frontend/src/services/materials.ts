/**
 * Materials service mapping /docs/ARCHITECTURE_SOURCE.md Section 5.2.
 * All HTTP requests route through the shared Axios client.
 */
import { http } from './http'
import type { Material } from '@/types/domain'
import type { UpdateMaterialRequest, ReindexMaterialResponse } from '@/types/api'

export interface UploadMaterialPayload {
  courseId: string
  title: string
  description?: string
  file: File | { name: string; size: number; type: string }
}

/**
 * GET /api/materials/course/:courseId
 * List materials for a course.
 */
export async function listCourseMaterials(courseId: string): Promise<Material[]> {
  const res = await http.get<Material[]>(`/materials/course/${courseId}`)
  return res.data
}

/**
 * POST /api/materials
 * Upload and register course material.
 * Sends courseId, title, description, and file metadata.
 */
export async function uploadMaterial(payload: UploadMaterialPayload): Promise<Material> {
  const fileName = payload.file.name
  const fileSize = payload.file.size
  const mimeType = payload.file.type || 'application/octet-stream'

  const res = await http.post<Material>('/materials', {
    courseId: payload.courseId,
    title: payload.title,
    description: payload.description,
    fileName,
    fileSize,
    mimeType,
  })
  return res.data
}

/**
 * PUT /api/materials/:materialId
 * Manage material record (title, description).
 */
export async function updateMaterial(
  materialId: string,
  payload: UpdateMaterialRequest,
): Promise<Material> {
  const res = await http.put<Material>(`/materials/${materialId}`, payload)
  return res.data
}

/**
 * DELETE /api/materials/:materialId
 * Delete material record and clean up index entries.
 */
export async function deleteMaterial(materialId: string): Promise<{ success: boolean; id: string }> {
  const res = await http.delete<{ success: boolean; id: string }>(`/materials/${materialId}`)
  return res.data
}

/**
 * POST /api/materials/:materialId/reindex
 * EXTENSION (RAG ingestion): Request vector reindexing through Ingestion Agent.
 */
export async function reindexMaterial(materialId: string): Promise<ReindexMaterialResponse> {
  const res = await http.post<ReindexMaterialResponse>(`/materials/${materialId}/reindex`)
  return res.data
}
