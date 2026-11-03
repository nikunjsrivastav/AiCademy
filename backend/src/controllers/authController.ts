import type { Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { db, ensureConnected, getLastMongoError } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { User, Role } from '../types/index.js'

function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: '7d' }
  )
}

function sanitizeUser(user: User) {
  const { passwordHash: _, ...rest } = user
  return rest
}

export async function register(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, password, role, department, studentNumber } = req.body
    if (!name || !email || !password || !role) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Name, email, password, and role are required' })
    }

    if (config.mongoUri) {
      const ok = await ensureConnected()
      if (!ok) {
        const lastErr = getLastMongoError()
        return res.status(503).json({
          code: 'DATABASE_UNAVAILABLE',
          message: `Cannot register account: MongoDB Atlas connection failed (${lastErr || 'Connection timed out'}). Please check your MongoDB Atlas Network Access (allow 0.0.0.0/0).`,
        })
      }
    }

    // Check email uniqueness from MongoDB Atlas
    const existing = await db.findUserByEmail(email.trim())
    if (existing) {
      return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'An account with this email address already exists' })
    }

    const salt = bcrypt.genSaltSync(10)
    const passwordHash = bcrypt.hashSync(password, salt)
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: role as Role,
      profile: {
        department: department || 'General',
        studentNumber: studentNumber || (role === 'student' ? `STU-${Date.now().toString().slice(-4)}` : undefined),
        avatarHue: Math.floor(Math.random() * 360),
      },
      createdAt: new Date().toISOString(),
    }

    await db.saveUser(newUser)
    const token = generateToken(newUser)
    return res.status(201).json({ token, user: sanitizeUser(newUser) })
  } catch (err: any) {
    console.error('[Auth Register Error]:', err)
    return res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: err?.message || 'Server error during registration' })
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Email and password are required' })
    }

    if (config.mongoUri) {
      const ok = await ensureConnected()
      if (!ok) {
        const lastErr = getLastMongoError()
        return res.status(503).json({
          code: 'DATABASE_UNAVAILABLE',
          message: `Cannot sign in: MongoDB Atlas is unreachable (${lastErr || 'Connection timed out'}). Please check your MongoDB Atlas Network Access (allow 0.0.0.0/0).`,
        })
      }
    }

    const user = await db.findUserByEmail(email.trim())
    if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid university email or password' })
    }

    const token = generateToken(user)
    return res.json({ token, user: sanitizeUser(user) })
  } catch (err: any) {
    console.error('[Auth Login Error]:', err)
    return res.status(500).json({ code: 'INTERNAL_SERVER_ERROR', message: err?.message || 'Server error during login' })
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' })
  }
  return res.json({ user: sanitizeUser(req.user) })
}

