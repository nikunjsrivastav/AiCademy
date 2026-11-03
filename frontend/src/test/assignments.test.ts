import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import * as authService from '@/services/auth'
import * as assignmentService from '@/services/assignments'
import * as submissionService from '@/services/submissions'
import { tokenStorage } from '@/services/tokenStorage'
import { DEMO_PASSWORD } from '@/mocks/db/seed'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  tokenStorage.clear()
})
afterAll(() => server.close())

describe('Assignments & Submissions Flow (Milestone 4)', () => {
  it('allows a professor to create an assignment with structured rubric criteria (D2)', async () => {
    const login = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    const created = await assignmentService.createAssignment({
      courseId: 'crs_cs301',
      title: 'Lab 2: B+ Tree Concurrency',
      description: 'Implement lock-coupling concurrent tree latches.',
      classification: 'assignment',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      maxMarks: 100,
      rubric: [
        { title: 'Lock Coupling Correctness', description: 'Crabbing latch hierarchy', maxMarks: 60 },
        { title: 'Deadlock Freedom Proof', description: 'Wait-die vs wound-wait analysis', maxMarks: 40 },
      ],
      topics: ['B+ Tree', 'Concurrency', 'Latches'],
    })

    expect(created.id).toBeDefined()
    expect(created.title).toBe('Lab 2: B+ Tree Concurrency')
    expect(created.rubric.length).toBe(2)
    expect(created.maxMarks).toBe(100)
    expect(created.classification).toBe('assignment')
  })

  it('allows an enrolled student to view assignments and upload submissions with format/size validation (D10)', async () => {
    const login = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    // List assignments
    const assignments = await assignmentService.listCourseAssignments('crs_cs301')
    expect(assignments.length).toBeGreaterThanOrEqual(2)
    const target = assignments[0]

    // 1. Upload invalid format (.exe) -> should reject
    await expect(
      submissionService.uploadSubmission(target.id, {
        fileName: 'malicious_code.exe',
        fileSize: 1000,
      })
    ).rejects.toThrow('Unsupported file type')

    // 2. Upload file exceeding 10MB -> should reject
    await expect(
      submissionService.uploadSubmission(target.id, {
        fileName: 'huge_archive.zip',
        fileSize: 15 * 1024 * 1024,
      })
    ).rejects.toThrow('exceeds maximum limit of 10 MB')

    // 3. Valid submission
    const submission = await submissionService.uploadSubmission(target.id, {
      fileName: 'aarav_solution_v1.pdf',
      fileSize: 1_200_000,
    })

    expect(submission.id).toBeDefined()
    expect(submission.fileName).toBe('aarav_solution_v1.pdf')
    expect(submission.evaluationStatus).toBe('evaluating')

    // 4. Resubmission increments version (Decision D8)
    const resubmission = await submissionService.uploadSubmission(target.id, {
      fileName: 'aarav_solution_v2.pdf',
      fileSize: 1_300_000,
    })

    expect(resubmission.version).toBeGreaterThan(1)
  })

  it('allows a professor to review and override scores while preserving AI evaluation (D9)', async () => {
    // 1. Student uploads work
    const studentLogin = await authService.login({
      email: 'student3@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(studentLogin.token)

    const sub = await submissionService.uploadSubmission('asg_cs301_01', {
      fileName: 'kenji_cs301_asg1.pdf',
      fileSize: 850_000,
    })

    // 2. Professor views submissions
    const profLogin = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(profLogin.token)

    const list = await submissionService.listAssignmentSubmissions('asg_cs301_01')
    expect(list.length).toBeGreaterThanOrEqual(1)

    // 3. Professor overrides score
    const scored = await submissionService.scoreSubmission(sub.id, {
      marks: 95,
      feedback: 'Excellent rigor on the minimal cover derivation.',
    })

    expect(scored.marks).toBe(95)
    expect(scored.feedback).toBe('Excellent rigor on the minimal cover derivation.')
    expect(scored.evaluationStatus).toBe('graded')
    expect(scored.gradedBy).toBe('u_prof_rao')
  })
})
