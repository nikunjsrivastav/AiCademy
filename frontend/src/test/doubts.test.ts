import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import * as authService from '@/services/auth'
import * as doubtService from '@/services/doubts'
import { tokenStorage } from '@/services/tokenStorage'
import { DEMO_PASSWORD } from '@/mocks/db/seed'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  tokenStorage.clear()
})
afterAll(() => server.close())

describe('AI Tutor & Question Quality (Milestone 5)', () => {
  it('allows a student to ask a doubt, receives citations and quality coaching score (B1.3, B1.4)', async () => {
    const login = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    const doubt = await doubtService.askDoubt({
      courseId: 'crs_cs301',
      question: 'What is Boyce-Codd Normal Form and why does 3NF preserve functional dependencies?',
    })

    expect(doubt.id).toBeDefined()
    expect(doubt.answer).toContain('Boyce-Codd Normal Form')
    expect(doubt.citations.length).toBeGreaterThanOrEqual(1)
    expect(doubt.citations[0].materialTitle).toBeDefined()
    expect(doubt.citations[0].page).toBeGreaterThan(0)
    expect(doubt.qualityScore).toBeDefined()
    expect(doubt.qualityScore?.score).toBeGreaterThan(60)
    expect(doubt.qualityScore?.tip).toBeDefined()
  })

  it('allows a student to clear their chat view non-destructively via ChatClearMarker (Section 4)', async () => {
    const login = await authService.login({
      email: 'student2@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    // 1. Ask a question
    await doubtService.askDoubt({
      courseId: 'crs_cs301',
      question: 'How do index-organized tables differ from heap tables?',
    })

    // 2. Verify doubt appears in history
    const historyBefore = await doubtService.listCourseDoubts('crs_cs301')
    expect(historyBefore.length).toBeGreaterThanOrEqual(1)

    // 3. Clear chat
    const clearRes = await doubtService.clearChatHistory('crs_cs301')
    expect(clearRes.success).toBe(true)
    expect(clearRes.clearedAt).toBeDefined()

    // 4. Verify history is visually cleared for this student
    const historyAfter = await doubtService.listCourseDoubts('crs_cs301')
    expect(historyAfter.length).toBe(0)
  })
})
