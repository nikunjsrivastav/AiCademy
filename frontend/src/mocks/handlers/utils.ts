/** Shared helpers for MSW handlers. TODO(backend): equivalent Express middleware in Phase 1. */
import { delay, HttpResponse } from 'msw'
import { API_BASE_URL } from '@/config'
import type { Role, User } from '@/types/domain'
import type { ApiErrorBody } from '@/types/api'
import { getDb } from '../db/store'
import type { MockUserRecord } from '../db/seed'
import { verifyMockJwt } from '../jwt'

/** Full URL pattern for an API path, e.g. api('/auth/login'). */
export const api = (path: string): string => `${API_BASE_URL}${path}`

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
): Response {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message, details } }, { status })
}

/** Simulated network latency (kept short so the prototype feels fast). */
export async function latency(min = 150, max = 400): Promise<void> {
  await delay(min + Math.floor(Math.random() * (max - min)))
}

export function toPublicUser(record: MockUserRecord): User {
  const { passwordHash: _omit, ...publicUser } = record
  void _omit
  return publicUser
}

type AuthResult =
  | { ok: true; user: MockUserRecord }
  | { ok: false; response: ReturnType<typeof errorResponse> }

/** Verify the bearer token (PDF 5: "Protected routes require a valid bearer token"). */
export function authenticate(request: Request, roles?: Role[]): AuthResult {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const payload = token ? verifyMockJwt(token) : null
  if (!payload) {
    return { ok: false, response: errorResponse(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.') }
  }
  const user = getDb().users.find((u) => u.id === payload.sub)
  if (!user) {
    return { ok: false, response: errorResponse(401, 'UNAUTHORIZED', 'Account no longer exists.') }
  }
  if (roles && !roles.includes(user.role)) {
    return { ok: false, response: errorResponse(403, 'FORBIDDEN', 'You do not have permission to do that.') }
  }
  return { ok: true, user }
}
