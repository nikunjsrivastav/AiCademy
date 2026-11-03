import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config/index.js'

const uploadBasePath = path.isAbsolute(config.uploadDir)
  ? config.uploadDir
  : path.resolve(process.cwd(), config.uploadDir)
const materialsDir = path.join(uploadBasePath, 'materials')
const submissionsDir = path.join(uploadBasePath, 'submissions')

try {
  fs.mkdirSync(materialsDir, { recursive: true })
  fs.mkdirSync(submissionsDir, { recursive: true })
} catch (err) {
  console.warn('[Upload Middleware] Could not pre-create upload directories:', err)
}

const materialStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, materialsDir)
  },
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${sanitized}`)
  },
})

const submissionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, submissionsDir)
  },
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${sanitized}`)
  },
})

export const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per D10
})

export const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per D10
})

