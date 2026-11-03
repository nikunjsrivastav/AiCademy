import type { Request, Response, NextFunction } from 'express'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error Middleware]', err)
  const status = err.status || 500
  const code = err.code || 'INTERNAL_SERVER_ERROR'
  const message = err.message || 'An unexpected error occurred'
  res.status(status).json({ code, message, details: err.details })
}

