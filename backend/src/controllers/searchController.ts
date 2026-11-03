import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export async function searchGlobal(req: AuthenticatedRequest, res: Response) {
  const q = ((req.query.q as string) || '').toLowerCase().trim()
  if (!q) {
    return res.json({ courses: [], materials: [], assignments: [] })
  }

  const courses = Array.from(db.courses.values())
    .filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    .slice(0, 5)

  const materials = Array.from(db.materials.values())
    .filter((m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
    .slice(0, 5)

  const assignments = Array.from(db.assignments.values())
    .filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
    .slice(0, 5)

  return res.json({ courses, materials, assignments })
}

