/**
 * Mock JWT. Looks like a JWT (header.payload.signature) but is NOT signed or secure.
 * TODO(backend): real JWT signing/verification with JWT_SECRET in Express (ROADMAP Phase 1).
 */
import type { Role } from '@/types/domain'

export interface MockJwtPayload {
  sub: string
  email: string
  role: Role
  iat: number
  exp: number
}

const TOKEN_TTL_SECONDS = 8 * 60 * 60
const MOCK_SIGNATURE = 'mock-signature-not-secure'

function b64urlEncode(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  return atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
}

export function signMockJwt(user: { id: string; email: string; role: Role }, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000)
  const header = b64urlEncode(JSON.stringify({ alg: 'none', typ: 'JWT', mock: true }))
  const payload = b64urlEncode(
    JSON.stringify({ sub: user.id, email: user.email, role: user.role, iat, exp: iat + TOKEN_TTL_SECONDS }),
  )
  return `${header}.${payload}.${MOCK_SIGNATURE}`
}

/** Returns the payload if the token is well-formed and unexpired, else null. */
export function verifyMockJwt(token: string, nowMs = Date.now()): MockJwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3 || parts[2] !== MOCK_SIGNATURE) return null
  try {
    const payload = JSON.parse(b64urlDecode(parts[1])) as MockJwtPayload
    if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
    if (payload.exp * 1000 < nowMs) return null
    return payload
  } catch {
    return null
  }
}
