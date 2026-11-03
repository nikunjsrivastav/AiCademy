import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import * as authService from '@/services/auth'
import { tokenStorage } from '@/services/tokenStorage'
import { DEMO_PASSWORD } from '@/mocks/db/seed'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  tokenStorage.clear()
})
afterAll(() => server.close())

describe('Auth Service with MSW', () => {
  it('logs in successfully with seeded student credentials', async () => {
    const res = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })

    expect(res.token).toBeDefined()
    expect(res.user.email).toBe('student1@aicademy.dev')
    expect(res.user.role).toBe('student')
    expect(res.user.name).toBe('Aarav Sharma')
  })

  it('fails with 401 when given incorrect password', async () => {
    await expect(
      authService.login({
        email: 'student1@aicademy.dev',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow('Incorrect email or password')
  })

  it('registers a new student successfully', async () => {
    const res = await authService.register({
      name: 'New Tester',
      email: 'newtester@aicademy.dev',
      password: 'password123',
      role: 'student',
    })

    expect(res.user.name).toBe('New Tester')
    expect(res.user.email).toBe('newtester@aicademy.dev')
    expect(res.user.role).toBe('student')
    expect(res.token).toBeDefined()
  })

  it('retrieves authenticated profile via getMe', async () => {
    // 1. Log in
    const loginRes = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    // 2. Query /api/auth/me
    const meRes = await authService.getMe()
    expect(meRes.user.email).toBe('prof.rao@aicademy.dev')
    expect(meRes.user.role).toBe('professor')
  })
})
