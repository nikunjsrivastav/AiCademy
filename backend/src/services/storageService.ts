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

  // Check if Vercel Blob is configured
  if (config.blobToken) {
    try {
      const blob = await put(blobPath, file.buffer || fs.readFileSync(file.path), {
        access: 'public',
        token: config.blobToken,
      })

      // Clean up temporary local file if multer saved it to disk
      if (file.path && fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path)
        } catch {
          // ignore cleanup error
        }
      }

      return {
        url: blob.url,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      }
    } catch (err) {
      console.warn('[Storage Service] Vercel Blob upload failed, falling back to local disk:', err)
    }
  }

  // Fallback to local or /tmp filesystem
  const uploadBasePath = path.isAbsolute(config.uploadDir)
    ? config.uploadDir
    : path.resolve(process.cwd(), config.uploadDir)
  const targetDir = path.join(uploadBasePath, folder)

  fs.mkdirSync(targetDir, { recursive: true })
  const diskPath = path.join(targetDir, `${Date.now()}-${sanitizedName}`)

  if (file.buffer) {
    fs.writeFileSync(diskPath, file.buffer)
  }

  return {
    url: `/uploads/${folder}/${path.basename(diskPath)}`,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
  }
}

