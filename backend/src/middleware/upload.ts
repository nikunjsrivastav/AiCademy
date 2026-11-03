import multer from 'multer'

/**
 * Universal Serverless In-Memory Storage:
 * Uses multer.memoryStorage() so file.buffer is always available in memory
 * for both Vercel Serverless Lambdas and local development.
 * Eliminates filesystem read-only errors and avoids disk race conditions.
 */
export const uploadMaterial = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per D10
})

export const uploadSubmission = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per D10
})


