import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { db } from '../models/db.js'
import type { User, Role } from '../types/index.js'

export interface AuthenticatedRequest extends Request {
  user?: User
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string }
    const user = await db.getUser(decoded.id)
    if (!user) {
      return res.status(401).json({ code: 'INVALID_TOKEN', message: 'User not found' })
    }
    req.user = user
    next()
  } catch {
    return res.status(401).json({ code: 'EXPIRED_OR_INVALID_TOKEN', message: 'Invalid or expired token' })
  }
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Insufficient permissions for this resource' })
    }
    next()
  }
}

