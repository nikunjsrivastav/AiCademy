// Safe global polyfills for serverless environments (prevents DOMMatrix/Canvas ReferenceErrors)
if (typeof (globalThis as any).DOMMatrix === 'undefined') {
  ;(globalThis as any).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0
    constructor(init?: any) {
      if (Array.isArray(init) && init.length === 6) {
        this.a = init[0]; this.b = init[1]; this.c = init[2]
        this.d = init[3]; this.e = init[4]; this.f = init[5]
      }
    }
    translateSelf(x = 0, y = 0) {
      this.e = this.a * x + this.c * y + this.e
      this.f = this.b * x + this.d * y + this.f
      return this
    }
    scaleSelf(scaleX = 1, scaleY = scaleX) {
      this.a *= scaleX; this.b *= scaleX
      this.c *= scaleY; this.d *= scaleY
      return this
    }
  }
}
if (typeof (globalThis as any).Path2D === 'undefined') {
  ;(globalThis as any).Path2D = class Path2D {}
}
if (typeof (globalThis as any).ImageData === 'undefined') {
  ;(globalThis as any).ImageData = class ImageData {}
}

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import { config } from './config/index.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { getMongoStatus, ensureConnected } from './models/db.js'

export const app = express()

// Security & Parsing
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({ origin: config.corsOrigin, credentials: true }))
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ extended: true, limit: '25mb' }))
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'))

// Static Uploads
const uploadDir = path.resolve(process.cwd(), config.uploadDir)
app.use('/uploads', express.static(uploadDir))

// API Routes (Mounted on both /api and root to handle any rewrite prefixing)
app.use('/api', apiRouter)
app.use('/', apiRouter)

// Health check with live MongoDB diagnostic
app.get(['/health', '/api/health'], async (_req, res) => {
  await ensureConnected().catch(() => false)
  const dbStatus = await getMongoStatus()
  res.json({
    status: 'ok',
    service: 'AiCademy API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// Error Handling
app.use(errorHandler)

export default app

