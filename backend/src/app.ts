import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'node:path'
import { config } from './config/index.js'
import { apiRouter } from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'

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

// API Routes
app.use('/api', apiRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AiCademy API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// Error Handling
app.use(errorHandler)

