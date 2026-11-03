import { put } from '@vercel/blob'
import path from 'node:path'
import fs from 'node:fs'
import { config } from '../config/index.js'

export interface UploadResult {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

/**
 * Universal Storage Handler:
 * - Uses Vercel Blob CDN in production when BLOB_READ_WRITE_TOKEN is set.
 * - Falls back to local/tmp disk storage for offline development.
 */
export async function uploadFileToStorage(
  folder: 'materials' | 'submissions',
  file: Express.Multer.File
): Promise<UploadResult> {
  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
  const blobPath = `${folder}/${Date.now()}-${sanitizedName}`
  const buffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null)
  const fileSize = file.size || (buffer ? buffer.length : 0)
  const mimeType = file.mimetype || 'application/octet-stream'

  // Check if Vercel Blob is configured
  if (config.blobToken && buffer) {
    try {
      const blob = await put(blobPath, buffer, {
        access: 'public',
        token: config.blobToken,
      })

      return {
        url: blob.url,
        fileName: file.originalname,
        fileSize,
        mimeType,
      }
    } catch (err) {
      console.warn('[Storage Service] Vercel Blob upload failed, falling back to local disk:', err)
    }
  }

  // Fallback to local or /tmp filesystem
  try {
    const uploadBasePath = path.isAbsolute(config.uploadDir)
      ? config.uploadDir
      : path.resolve(process.cwd(), config.uploadDir)
    const targetDir = path.join(uploadBasePath, folder)

    fs.mkdirSync(targetDir, { recursive: true })
    const diskPath = path.join(targetDir, `${Date.now()}-${sanitizedName}`)

    if (buffer) {
      fs.writeFileSync(diskPath, buffer)
    } else if (file.path && fs.existsSync(file.path)) {
      fs.copyFileSync(file.path, diskPath)
    }

    return {
      url: `/uploads/${folder}/${path.basename(diskPath)}`,
      fileName: file.originalname,
      fileSize,
      mimeType,
    }
  } catch (diskErr) {
    console.warn('[Storage Service] Local disk write fallback failed (e.g. read-only serverless):', diskErr)
    return {
      url: `/uploads/${folder}/${sanitizedName}`,
      fileName: file.originalname,
      fileSize,
      mimeType,
    }
  }
}

