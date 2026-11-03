import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import * as authService from '@/services/auth'
import * as announcementService from '@/services/announcements'
import * as leaderboardService from '@/services/leaderboard'
import * as analyticsService from '@/services/analytics'
import { tokenStorage } from '@/services/tokenStorage'
import { DEMO_PASSWORD } from '@/mocks/db/seed'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  tokenStorage.clear()
})
afterAll(() => server.close())

describe('Announcements, Leaderboard & Analytics (Milestone 6)', () => {
  it('handles announcement creation, retrieval with embedded comments, and thread replies (D7)', async () => {
    // 1. Professor publishes announcement
    const profLogin = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(profLogin.token)

    const anc = await announcementService.createAnnouncement({
      courseId: 'crs_cs301',
      title: 'Midterm Exam Review Guidelines',
      content: 'The review session will be held in Room 402 this Wednesday.',
    })
    expect(anc.id).toBeDefined()
    expect(anc.title).toBe('Midterm Exam Review Guidelines')

    // 2. Student views announcements and replies with comment
    const studentLogin = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(studentLogin.token)

    const list = await announcementService.listCourseAnnouncements('crs_cs301')
    expect(list.some((a) => a.id === anc.id)).toBe(true)

    const comment = await announcementService.addAnnouncementComment(anc.id, {
      text: 'Will the slides be recorded and uploaded?',
    })
    expect(comment.id).toBeDefined()
    expect(comment.text).toBe('Will the slides be recorded and uploaded?')
    expect(comment.author.name).toBe('Aarav Sharma')
  })

  it('computes leaderboard rankings using D3 formula (50% asg + 30% proj + 20% doubts) and supports recomputing', async () => {
    const login = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    const ldb = await leaderboardService.getCourseLeaderboard('crs_cs301')
    expect(ldb.entries.length).toBeGreaterThan(0)
    expect(ldb.entries[0].rank).toBe(1)
    expect(ldb.entries[0].total).toBeGreaterThan(0)
    expect(ldb.weights.assignments).toBe(0.5)
    expect(ldb.weights.projects).toBe(0.3)
    expect(ldb.weights.doubts).toBe(0.2)

    // Professor recomputes leaderboard snapshot
    const profLogin = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(profLogin.token)

    const recomputed = await leaderboardService.recomputeLeaderboard('crs_cs301')
    expect(recomputed.computedAt).toBeDefined()
    expect(recomputed.entries.length).toBe(ldb.entries.length)
  })

  it('retrieves learning analytics with score distributions and AI override rate (D9)', async () => {
    const profLogin = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(profLogin.token)

    const stats = await analyticsService.getCourseAnalytics('crs_cs301')
    expect(stats.courseId).toBe('crs_cs301')
    expect(stats.scoreDistribution.length).toBe(4)
    expect(stats.topicDifficulty.length).toBeGreaterThan(0)
    expect(stats.doubtTrends.length).toBe(7)
    expect(stats.overrideRate).toBeDefined()
  })
})
