import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import * as authService from '@/services/auth'
import * as courseService from '@/services/courses'
import { tokenStorage } from '@/services/tokenStorage'
import { DEMO_PASSWORD } from '@/mocks/db/seed'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  tokenStorage.clear()
})
afterAll(() => server.close())

describe('Courses Service with MSW', () => {
  it('lists courses enrolled by a student', async () => {
    // 1. Log in as student1 (Aarav Sharma)
    const loginRes = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    // 2. Fetch courses
    const courses = await courseService.listCourses()
    expect(courses.length).toBeGreaterThanOrEqual(2)
    const cs301 = courses.find((c) => c.code === 'CS301')
    expect(cs301).toBeDefined()
    expect(cs301?.name).toBe('Database Systems')
    expect(cs301?.professor?.name).toBe('Dr. Priya Rao')
    expect(cs301?.studentCount).toBe(4)
  })

  it('looks up a course by 6-character enrollment code', async () => {
    const loginRes = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    // Lookup valid code (case-insensitive)
    const course = await courseService.lookupCourseByCode('db301x')
    expect(course.code).toBe('CS301')
    expect(course.enrollmentCode).toBe('DB301X')
    expect(course.name).toBe('Database Systems')

    // Lookup non-existent code
    await expect(courseService.lookupCourseByCode('INVALID')).rejects.toThrow(
      'No active course found with this enrollment code.',
    )
  })

  it('enrolls a student into a new course with a valid code and blocks duplicate enrollment', async () => {
    // Student 8 (Fatima) is initially enrolled in CS220 only
    const loginRes = await authService.login({
      email: 'student8@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    // Fatima enrolls into CS301 (code DB301X)
    const enrollRes = await courseService.enrollInCourse('crs_cs301', 'DB301X')
    expect(enrollRes.message).toContain('Database Systems')

    // Enrolling again should throw 409 ALREADY_ENROLLED
    await expect(courseService.enrollInCourse('crs_cs301', 'DB301X')).rejects.toThrow(
      'already enrolled',
    )
  })

  it('allows a professor to create a new course and generate an enrollment code', async () => {
    // Log in as Dr. Priya Rao
    const loginRes = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    const newCourse = await courseService.createCourse({
      code: 'CS450',
      name: 'Advanced Distributed Systems',
      description: 'Consensus protocols, Raft, Paxos, and Byzantine Fault Tolerance.',
      department: 'Computer Science',
      term: 'Fall 2026',
    })

    expect(newCourse.id).toBeDefined()
    expect(newCourse.code).toBe('CS450')
    expect(newCourse.enrollmentCode.length).toBe(6)
    expect(newCourse.professorId).toBe(loginRes.user.id)
  })

  it('retrieves the student roster for an authorized course', async () => {
    const loginRes = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    const students = await courseService.listCourseStudents('crs_cs301')
    expect(students.length).toBeGreaterThanOrEqual(4)
    expect(students.some((s) => s.email === 'student1@aicademy.dev')).toBe(true)
  })
})
