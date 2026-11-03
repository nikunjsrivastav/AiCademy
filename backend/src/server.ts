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

