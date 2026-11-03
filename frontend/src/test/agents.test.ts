import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import * as authService from '@/services/auth'
import * as agentService from '@/services/agents'
import { tokenStorage } from '@/services/tokenStorage'
import { DEMO_PASSWORD } from '@/mocks/db/seed'
import { toolRegistry } from '@/mocks/agents/registry'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  tokenStorage.clear()
})
afterAll(() => server.close())

describe('Agentic AI Layer (Milestone 3)', () => {
  it('validates 13 typed tools with Zod and enforces course scope isolation', async () => {
    // 1. Valid vector search in correct course
    const validSearch = await toolRegistry.call(
      'vector_search',
      { courseId: 'crs_cs301', query: 'normalization', topK: 2 },
      { actorId: 'u_s1', actorRole: 'student', courseId: 'crs_cs301', runId: 'run_test_1' }
    )
    expect(validSearch.success).toBe(true)
    expect((validSearch.data as any).matches.length).toBeGreaterThan(0)

    // 2. Cross-course isolation check (B2: an agent can never read another course data)
    const crossCourseViolation = await toolRegistry.call(
      'vector_search',
      { courseId: 'crs_ai410', query: 'transformers', topK: 2 },
      { actorId: 'u_s1', actorRole: 'student', courseId: 'crs_cs301', runId: 'run_test_2' }
    )
    expect(crossCourseViolation.success).toBe(false)
    expect(crossCourseViolation.error).toContain('Course isolation violation')

    // 3. Schema validation rejection (missing required fields)
    const invalidInput = await toolRegistry.call(
      'vector_search',
      { query: 'test' }, // missing courseId
      { actorId: 'u_s1', actorRole: 'student', courseId: 'crs_cs301', runId: 'run_test_3' }
    )
    expect(invalidInput.success).toBe(false)
    expect(invalidInput.error).toContain('Invalid input')
  })

  it('executes Ingestion Agent with extraction, chunking, embedding, and self-test verification', async () => {
    const login = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    // Start Ingestion Agent run
    const run = await agentService.startAgentRun({
      agent: 'ingestion',
      courseId: 'crs_cs301',
      trigger: { kind: 'event', event: 'material.uploaded', description: 'Test material upload' },
      input: {
        materialId: 'mat_cs301_01',
        fileName: 'CS301_Lec01_Relational_Model.pdf',
      },
    })

    expect(run.id).toBeDefined()
    expect(run.agent).toBe('ingestion')

    // Fetch full trace
    const trace = await agentService.getAgentRunTrace(run.id)
    expect(trace.steps.length).toBeGreaterThanOrEqual(4)

    // Verify step types
    const types = trace.steps.map((s) => s.type)
    expect(types).toContain('plan')
    expect(types).toContain('tool_call')
    expect(types).toContain('reflection')

    // Verify token usage and cost are recorded
    expect(trace.usage.totalTokens).toBeGreaterThan(0)
    expect(trace.usage.estimatedCostUsd).toBeGreaterThan(0)
  })

  it('executes Grader Agent, flags prompt injection via critic (D13), and requests human approval (D12)', async () => {
    const login = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    // Launch Grader Agent with adversarial simulation
    const run = await agentService.startAgentRun({
      agent: 'grader',
      courseId: 'crs_cs301',
      trigger: { kind: 'event', event: 'submission.created', description: 'Adversarial submission' },
      input: {
        submissionId: 'sub_test_adversarial',
        assignmentId: 'asg_test_1',
        studentName: 'Test Student',
      },
      simulation: 'failure', // Triggers prompt injection critic detection
    })

    const trace = await agentService.getAgentRunTrace(run.id)
    // Run should be paused waiting for human review
    expect(trace.status).toBe('waiting_for_approval')

    // Check steps for critic injection flag
    const criticStep = trace.steps.find((s) => s.type === 'reflection' && s.content.includes('CRITIC ALERT'))
    expect(criticStep).toBeDefined()

    // Verify approval request was created
    const approvals = await agentService.listApprovals('crs_cs301')
    const matchingApproval = approvals.find((a) => a.runId === run.id)
    expect(matchingApproval).toBeDefined()
    expect(matchingApproval?.status).toBe('pending')

    // Professor decides approval
    const decided = await agentService.decideApproval(matchingApproval!.id, {
      decision: 'approve',
      note: 'Verified manually by professor Priya Rao',
      payloadOverride: { marks: 80, approvedFeedback: 'Manual override after reviewing injection attempt' },
    })
    expect(decided.status).toBe('approved')

    // Re-check trace status: should transition to succeeded
    const updatedTrace = await agentService.getAgentRunTrace(run.id)
    expect(updatedTrace.status).toBe('succeeded')
  })

  it('executes Tutor Agent and provides honest refusal when query is out of scope (B1.3)', async () => {
    const login = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    // Run tutor agent with out of scope simulation
    const run = await agentService.startAgentRun({
      agent: 'tutor',
      courseId: 'crs_cs301',
      trigger: { kind: 'user_action', description: 'Out of scope question' },
      input: {
        question: 'How do I cook Italian lasagna?',
        isOutOfScope: true,
      },
      simulation: 'failure',
    })

    const trace = await agentService.getAgentRunTrace(run.id)
    const finalOutput = trace.finalOutput as any
    expect(finalOutput.outOfScope).toBe(true)
    expect(finalOutput.confidence).toBeLessThan(0.5)
    expect(finalOutput.answer).toContain('falls outside the current syllabus')
  })

  it('enforces course policy guardrails when an agent is disabled', async () => {
    const login = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(login.token)

    // Disable study_coach agent for CS301
    await agentService.updateAgentPolicy('crs_cs301', {
      enabledAgents: {
        orchestrator: true,
        ingestion: true,
        tutor: true,
        question_quality: true,
        grader: true,
        insights: true,
        study_coach: false,
      },
    })

    // Try starting disabled agent
    const rejectedRun = await agentService.startAgentRun({
      agent: 'study_coach',
      courseId: 'crs_cs301',
      trigger: { kind: 'manual', description: 'Disabled agent test' },
      input: {},
    })

    expect(rejectedRun.status).toBe('failed')
    expect(rejectedRun.error).toContain('disabled by course policy')
  })
})
