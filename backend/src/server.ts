import { app } from './app.js'
import { config } from './config/index.js'

const server = app.listen(config.port, () => {
  console.log(`[AiCademy Backend] Server running in ${config.nodeEnv} on http://localhost:${config.port}`)
  console.log(`[AiCademy Backend] API mounted at http://localhost:${config.port}/api`)
  console.log(`[AiCademy Backend] Health check available at http://localhost:${config.port}/health`)
})

process.on('SIGTERM', () => {
  console.log('[AiCademy Backend] SIGTERM received, shutting down gracefully')
  server.close(() => {
    process.exit(0)
  })
})

