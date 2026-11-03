import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export async function getAdminUsers(req: AuthenticatedRequest, res: Response) {
  const users = Array.from(db.users.values()).map((u) => {
    const { passwordHash: _, ...rest } = u
    return rest
  })
  return res.json(users)
}

export async function getAdminCourses(req: AuthenticatedRequest, res: Response) {
  const courses = Array.from(db.courses.values()).map((c) => {
    const prof = db.users.get(c.professorId)
    const materials = Array.from(db.materials.values()).filter((m) => m.courseId === c.id)
    return {
      ...c,
      studentCount: c.studentIds.length,
      materialCount: materials.length,
      professor: prof
        ? {
            id: prof.id,
            name: prof.name,
            email: prof.email,
            profile: prof.profile,
          }
        : undefined,
    }
  })
  return res.json(courses)
}

