import { describe, it, expect } from 'vitest'
import { signMockJwt, verifyMockJwt } from '@/mocks/jwt'

describe('Mock JWT', () => {
  it('signs a token and verifies it correctly', () => {
    const payload = { id: 'u_test123', email: 'test@aicademy.dev', role: 'student' as const }
    const token = signMockJwt(payload)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const verified = verifyMockJwt(token)
    expect(verified).not.toBeNull()
    expect(verified?.sub).toBe(payload.id)
    expect(verified?.email).toBe(payload.email)
    expect(verified?.role).toBe(payload.role)
  })

  it('rejects expired tokens', () => {
    const pastTime = Date.now() - 10 * 60 * 60 * 1000 // 10 hours ago (TTL is 8 hours)
    const token = signMockJwt(
      { id: 'u_expired', email: 'expired@aicademy.dev', role: 'professor' as const },
      pastTime,
    )
    const verified = verifyMockJwt(token, Date.now())
    expect(verified).toBeNull()
  })

  it('rejects malformed tokens', () => {
    expect(verifyMockJwt('invalid.token')).toBeNull()
    expect(verifyMockJwt('a.b.c')).toBeNull()
    expect(verifyMockJwt('')).toBeNull()
  })
})
