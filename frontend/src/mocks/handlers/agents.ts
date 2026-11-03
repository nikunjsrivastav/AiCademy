/**
 * MSW Handlers for /api/agents/* routes from /docs/AGENTIC_DESIGN.md B5.
 * TODO(backend): replaced by Express controllers in ROADMAP Phase 1.
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb, saveDb } from '../db/store'
import { agentEngine, toolRegistry } from '../agents'
import type { AgentRunWithSteps } from '@/types/agents'

export const agentsHandlers = [
  // POST /api/agents/runs: start an agent run
  http.post(api('/agents/runs'), async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 150)

    const body = (await request.json().catch(() => ({}))) as any
    if (!body.agent || !body.courseId) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Missing required agent or courseId')
    }

    const run = await agentEngine.startRun(
      body.agent,
      body.trigger || { kind: 'manual', description: `Manual execution of ${body.agent}` },
      body.input || {},
      {
        actorId: auth.user.id,
        actorRole: auth.user.role,
        courseId: body.courseId,
        simulation: body.simulation || 'normal',
      }
    )

    return HttpResponse.json(run, { status: 201 })
  }),

  // GET /api/agents/runs: list runs
  http.get(api('/agents/runs'), async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const url = new URL(request.url)
    const courseId = url.searchParams.get('courseId')
    const db = getDb()

    let runs = db.agentRuns
    if (courseId) {
      runs = runs.filter((r) => r.courseId === courseId)
    }

    // Students only see runs where they are the actor
    if (auth.user.role === 'student') {
      runs = runs.filter((r) => r.actorId === auth.user.id)
    }

    return HttpResponse.json(runs)
  }),

  // GET /api/agents/runs/:runId: get run with step trace
  http.get(api('/agents/runs/:runId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(30, 80)

    const { runId } = params
    const db = getDb()
    const run = db.agentRuns.find((r) => r.id === runId)
    if (!run) {
      return errorResponse(404, 'NOT_FOUND', `Run ${runId} not found`)
    }

    // Permission check: students can only see their own runs
    if (auth.user.role === 'student' && run.actorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only view your own agent traces')
    }

    const steps = db.agentSteps.filter((s) => s.runId === runId).sort((a, b) => a.index - b.index)
    const childRuns = db.agentRuns.filter((r) => r.parentRunId === runId).map((r) => r.id)

    const fullTrace: AgentRunWithSteps = {
      ...run,
      steps,
      childRunIds: childRuns,
    }

    return HttpResponse.json(fullTrace)
  }),

  // POST /api/agents/runs/:runId/cancel
  http.post(api('/agents/runs/:runId/cancel'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { runId } = params as { runId: string }
    const cancelled = agentEngine.cancelRun(runId)
    if (!cancelled) {
      return errorResponse(404, 'NOT_FOUND', `Run ${runId} not found`)
    }

    return HttpResponse.json(cancelled)
  }),

  // GET /api/agents/approvals: list pending approvals
  http.get(api('/agents/approvals'), async ({ request }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const url = new URL(request.url)
    const courseId = url.searchParams.get('courseId')
    const db = getDb()

    let approvals = db.approvals
    if (courseId) {
      approvals = approvals.filter((a) => a.courseId === courseId)
    }

    return HttpResponse.json(approvals)
  }),

  // POST /api/agents/approvals/:approvalId/decide
  http.post(api('/agents/approvals/:approvalId/decide'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(100, 200)

    const { approvalId } = params
    const db = getDb()
    const approval = db.approvals.find((a) => a.id === approvalId)
    if (!approval) {
      return errorResponse(404, 'NOT_FOUND', `Approval ${approvalId} not found`)
    }

    const body = (await request.json().catch(() => ({}))) as any
    const decision = body.decision // 'approve' | 'reject' | 'edit'

    approval.status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'edited'
    approval.reviewerId = auth.user.id
    approval.decidedAt = new Date().toISOString()
    approval.note = body.note

    // Apply approved action to domain state
    if (approval.status === 'approved' || approval.status === 'edited') {
      const payload = body.payloadOverride || approval.proposedAction.payload

      if (approval.proposedAction.kind === 'finalize_grade') {
        const sub = db.submissions.find((s) => s.id === approval.proposedAction.targetId)
        if (sub) {
          sub.marks = payload.marks ?? sub.aiEvaluation?.totalMarks ?? 85
          sub.feedback = payload.approvedFeedback ?? sub.aiEvaluation?.feedback ?? 'Approved'
          sub.evaluationStatus = 'graded'
          sub.gradedBy = auth.user.id
          sub.gradedAt = new Date().toISOString()
        }
      } else if (approval.proposedAction.kind === 'publish_announcement') {
        const newAnnouncement = {
          id: `anc_${Date.now().toString(36)}`,
          courseId: approval.courseId,
          authorId: auth.user.id,
          title: payload.title || 'Course Announcement',
          content: payload.content || '',
          linkedAssignmentIds: [],
          aiGenerated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          comments: [],
        }
        db.announcements.unshift(newAnnouncement)
      }

      // Resume or finalize run
      const run = db.agentRuns.find((r) => r.id === approval.runId)
      if (run && run.status === 'waiting_for_approval') {
        run.status = 'succeeded'
        run.endedAt = new Date().toISOString()
      }
    } else if (approval.status === 'rejected') {
      const run = db.agentRuns.find((r) => r.id === approval.runId)
      if (run && run.status === 'waiting_for_approval') {
        run.status = 'failed'
        run.error = `Action rejected by professor: ${body.note || 'No note provided'}`
        run.endedAt = new Date().toISOString()
      }
    }

    saveDb()
    return HttpResponse.json(approval)
  }),

  // GET /api/agents/policy/:courseId
  http.get(api('/agents/policy/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { courseId } = params
    const db = getDb()
    let policy = db.policies.find((p) => p.courseId === courseId)

    if (!policy) {
      // Create default
      policy = {
        courseId: courseId as string,
        enabledAgents: {
          orchestrator: true,
          ingestion: true,
          tutor: true,
          question_quality: true,
          grader: true,
          insights: true,
          study_coach: true,
        },
        autoPublish: false,
        confidenceThreshold: 0.75,
        dailyTokenBudget: 500000,
        tokensUsedToday: 0,
        updatedAt: new Date().toISOString(),
      }
      db.policies.push(policy)
      saveDb()
    }

    return HttpResponse.json(policy)
  }),

  // PUT /api/agents/policy/:courseId
  http.put(api('/agents/policy/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(50, 150)

    const { courseId } = params
    const db = getDb()
    let policy = db.policies.find((p) => p.courseId === courseId)
    const patch = (await request.json().catch(() => ({}))) as any

    if (!policy) {
      policy = {
        courseId: courseId as string,
        enabledAgents: patch.enabledAgents || {
          orchestrator: true,
          ingestion: true,
          tutor: true,
          question_quality: true,
          grader: true,
          insights: true,
          study_coach: true,
        },
        autoPublish: patch.autoPublish ?? false,
        confidenceThreshold: patch.confidenceThreshold ?? 0.75,
        dailyTokenBudget: patch.dailyTokenBudget ?? 500000,
        tokensUsedToday: 0,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.user.id,
      }
      db.policies.push(policy)
    } else {
      if (patch.enabledAgents) policy.enabledAgents = { ...policy.enabledAgents, ...patch.enabledAgents }
      if (patch.autoPublish !== undefined) policy.autoPublish = patch.autoPublish
      if (patch.confidenceThreshold !== undefined) policy.confidenceThreshold = patch.confidenceThreshold
      if (patch.dailyTokenBudget !== undefined) policy.dailyTokenBudget = patch.dailyTokenBudget
      policy.updatedAt = new Date().toISOString()
      policy.updatedBy = auth.user.id
    }

    saveDb()
    return HttpResponse.json(policy)
  }),

  // GET /api/agents/memory/:courseId
  http.get(api('/agents/memory/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { courseId } = params
    const db = getDb()

    let memories = db.memories.filter((m) => m.courseId === courseId)
    if (auth.user.role === 'student') {
      memories = memories.filter((m) => m.subjectId === auth.user.id)
    }

    return HttpResponse.json(memories)
  }),

  // DELETE /api/agents/memory/:memoryId
  http.delete(api('/agents/memory/:memoryId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { memoryId } = params
    const db = getDb()
    const index = db.memories.findIndex((m) => m.id === memoryId)
    if (index === -1) {
      return errorResponse(404, 'NOT_FOUND', `Memory ${memoryId} not found`)
    }

    const memory = db.memories[index]
    if (auth.user.role === 'student' && memory.subjectId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You cannot delete another users memory')
    }

    db.memories.splice(index, 1)
    saveDb()
    return HttpResponse.json({ success: true })
  }),

  // GET /api/agents/study-plan/:courseId
  http.get(api('/agents/study-plan/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(100, 200)

    const { courseId } = params
    return HttpResponse.json({
      courseId,
      studentId: auth.user.id,
      title: 'Targeted Study Sprint',
      weakTopics: ['Relational Normalization', 'Join Algorithms'],
      recommendedMaterials: [
        { id: 'mat_cs301_02', title: 'Lecture 2: Relational Normalization & BCNF', pages: [4, 8, 12] },
      ],
      steps: [
        { step: 1, title: 'Review BCNF superkey criteria in Lecture 2', duration: '20 min' },
        { step: 2, title: 'Work through Practice Problem Set 3', duration: '35 min' },
      ],
    })
  }),

  // GET /api/agents/insights/:courseId
  http.get(api('/agents/insights/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(100, 200)

    const { courseId } = params
    return HttpResponse.json({
      courseId,
      frequentDoubts: [
        { topic: 'Boyce-Codd Normal Form', count: 14, percentage: 38 },
        { topic: 'B+ Tree Splitting', count: 9, percentage: 24 },
      ],
      performanceDropCriteria: 'Criterion 2: Functional Dependency Decomposition (-18% vs avg)',
      teachingSuggestion:
        '38% of student doubts this week focus on BCNF lossless decomposition. Consider hosting an optional 20-minute review session or publishing an explanatory note.',
      draftAnnouncementAvailable: true,
    })
  }),

  // GET /api/agents/tools
  http.get(api('/agents/tools'), async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    return HttpResponse.json(toolRegistry.listDefinitions())
  }),
]
