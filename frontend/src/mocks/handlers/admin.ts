/**
 * MSW Handlers for Admin Directory routes (Decision D5, D7).
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, latency } from './utils'
import { getDb } from '../db/store'

export const adminHandlers = [
  // GET /api/admin/users
  http.get(api('/admin/users'), async ({ request }) => {
    const auth = authenticate(request, ['administrator'])
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const db = getDb()
    const users = db.users.map(({ passwordHash: _omit, ...u }) => u)
    return HttpResponse.json(users)
  }),

  // GET /api/admin/courses
  http.get(api('/admin/courses'), async ({ request }) => {
    const auth = authenticate(request, ['administrator'])
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const db = getDb()
    const courses = db.courses.map((c) => {
      const prof = db.users.find((u) => u.id === c.professorId)
      return {
        ...c,
        professor: prof
          ? { id: prof.id, name: prof.name, email: prof.email, profile: prof.profile }
          : undefined,
        studentCount: c.studentIds.length,
        materialCount: db.materials.filter((m) => m.courseId === c.id).length,
      }
    })

    return HttpResponse.json(courses)
  }),
]
