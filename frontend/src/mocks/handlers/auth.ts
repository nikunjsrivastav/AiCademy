/** PDF Section 5.1: Authentication (mock). TODO(backend): Express auth controller + bcryptjs. */
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { AuthResponse, MeResponse } from '@/types/api'
import { getDb, newId, saveDb } from '../db/store'
import { mockHash, type MockUserRecord } from '../db/seed'
import { signMockJwt } from '../jwt'
import { api, authenticate, errorResponse, latency, toPublicUser } from './utils'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.email('Enter a valid email address').transform((e) => e.toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['student', 'professor']),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

export const authHandlers = [
  http.post(api('/auth/register'), async ({ request }) => {
    await latency()
    const parsed = registerSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Please fix the highlighted fields.', fieldErrors(parsed.error))
    }
    const db = getDb()
    if (db.users.some((u) => u.email === parsed.data.email)) {
      return errorResponse(409, 'EMAIL_TAKEN', 'An account with this email already exists.', {
        email: 'This email is already registered',
      })
    }
    const record: MockUserRecord = {
      id: newId('u'),
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      profile: { avatarHue: Math.floor(Math.random() * 360) },
      createdAt: new Date().toISOString(),
      passwordHash: mockHash(parsed.data.password),
    }
    db.users.push(record)
    saveDb()
    return HttpResponse.json<AuthResponse>(
      { token: signMockJwt(record), user: toPublicUser(record) },
      { status: 201 },
    )
  }),

  http.post(api('/auth/login'), async ({ request }) => {
    await latency()
    const parsed = loginSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return errorResponse(400, 'VALIDATION_ERROR', 'Email and password are required.')
    const record = getDb().users.find((u) => u.email === parsed.data.email)
    if (!record || record.passwordHash !== mockHash(parsed.data.password)) {
      return errorResponse(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
    }
    return HttpResponse.json<AuthResponse>({ token: signMockJwt(record), user: toPublicUser(record) })
  }),

  http.get(api('/auth/me'), async ({ request }) => {
    await latency(80, 200)
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    return HttpResponse.json<MeResponse>({ user: toPublicUser(auth.user) })
  }),
]
