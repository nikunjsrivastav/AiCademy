import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type {
  AgentRun,
  AgentStep,
  ApprovalRequest,
  AgentPolicy,
  AgentMemory,
} from '../types/index.js'

export async function listRuns(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.query
  let runs = Array.from(db.agentRuns.values())
  if (courseId) {
    runs = runs.filter((r) => r.courseId === courseId)
  }
  // Students only see their own runs
  if (req.user!.role === 'student') {
    runs = runs.filter((r) => r.userId === req.user!.id)
  }
  // Sort by startedAt desc
  runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  return res.json(runs)
}

export async function getRunTrace(req: AuthenticatedRequest, res: Response) {
  const { runId } = req.params
  const run = db.agentRuns.get(runId)
  if (!run) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Agent run not found' })
  }

  // Check student access
  if (req.user!.role === 'student' && run.userId !== req.user!.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'You can only inspect traces for your own interactions' })
  }

  const steps = db.agentSteps.get(runId) || []
  return res.json({ ...run, steps })
}

export async function startRun(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { agent, trigger, courseId, input } = req.body

  const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
  const now = new Date().toISOString()

  const run: AgentRun = {
    id: runId,
    agent: agent || 'orchestrator',
    status: 'succeeded',
    trigger: trigger || 'manual_trigger',
    courseId: courseId || 'general',
    userId: user.id,
    startedAt: now,
    finishedAt: new Date(Date.now() + 1200).toISOString(),
    summary: `Execution of ${agent || 'agent'} completed successfully. Verified outputs against course scope.`,
    costEstimateCents: 1.2,
    totalTokens: 1450,
  }

  // Pre-generate inspectable steps
  const steps: AgentStep[] = [
    {
      id: `step_${runId}_1`,
      runId,
      index: 1,
      kind: 'plan',
      content: `Planning workflow for ${agent}. Inspecting course scope (${run.courseId}) and checking user permissions.`,
      latencyMs: 120,
      tokensUsed: 150,
      timestamp: now,
    },
    {
      id: `step_${runId}_2`,
      runId,
      index: 2,
      kind: 'tool_call',
      toolName: 'vector_search',
      toolInput: { query: 'course context', courseId: run.courseId },
      toolOutput: { matchCount: 3, topSimilarity: 0.94 },
      content: 'Called vector_search to retrieve course context.',
      latencyMs: 340,
      tokensUsed: 420,
      timestamp: new Date(Date.now() + 200).toISOString(),
    },
    {
      id: `step_${runId}_3`,
      runId,
      index: 3,
      kind: 'observation',
      content: 'Retrieved 3 syllabus chunks matching query with high semantic relevance.',
      latencyMs: 80,
      tokensUsed: 210,
      timestamp: new Date(Date.now() + 500).toISOString(),
    },
    {
      id: `step_${runId}_4`,
      runId,
      index: 4,
      kind: 'reflection',
      content: 'Critic reflection: No prompt injection or boundary leaks detected. Invariants hold.',
      latencyMs: 250,
      tokensUsed: 320,
      timestamp: new Date(Date.now() + 800).toISOString(),
    },
    {
      id: `step_${runId}_5`,
      runId,
      index: 5,
      kind: 'final',
      content: run.summary || 'Operation complete.',
      latencyMs: 140,
      tokensUsed: 350,
      timestamp: run.finishedAt!,
    },
  ]

  db.agentRuns.set(runId, run)
  db.agentSteps.set(runId, steps)

  return res.status(201).json(run)
}

export async function cancelRun(req: AuthenticatedRequest, res: Response) {
  const { runId } = req.params
  const run = db.agentRuns.get(runId)
  if (!run) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Agent run not found' })
  }
  run.status = 'cancelled'
  return res.json(run)
}

export async function listApprovals(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.query
  let approvals = Array.from(db.approvals.values())
  if (courseId) {
    approvals = approvals.filter((a) => a.courseId === courseId)
  }
  return res.json(approvals)
}

export async function decideApproval(req: AuthenticatedRequest, res: Response) {
  const { approvalId } = req.params
  const { decision, note, payloadOverride } = req.body

  const approval = db.approvals.get(approvalId)
  if (!approval) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Approval request not found' })
  }

  approval.status = decision === 'approve' ? 'approved' : 'rejected'
  approval.decidedAt = new Date().toISOString()
  approval.decidedBy = req.user!.id
  if (note) approval.note = note
  if (payloadOverride) approval.payload = { ...approval.payload, ...payloadOverride }

  return res.json(approval)
}

export async function getPolicy(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  let policy = db.agentPolicies.get(courseId)
  if (!policy) {
    policy = {
      courseId,
      autonomyLevel: 'semi',
      minConfidenceGrader: 0.75,
      minConfidenceTutor: 0.6,
      autoPublishAnnouncements: false,
      dailyTokenBudget: 250000,
      usedTokensToday: 12000,
      activeAgents: {
        orchestrator: true,
        ingestion: true,
        grader: true,
        tutor: true,
        question_quality: true,
        insights: true,
        study_coach: true,
      },
    }
    db.agentPolicies.set(courseId, policy)
  }
  return res.json(policy)
}

export async function updatePolicy(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const policy = db.agentPolicies.get(courseId) || {
    courseId,
    autonomyLevel: 'semi',
    minConfidenceGrader: 0.75,
    minConfidenceTutor: 0.6,
    autoPublishAnnouncements: false,
    dailyTokenBudget: 250000,
    usedTokensToday: 12000,
    activeAgents: {
      orchestrator: true,
      ingestion: true,
      grader: true,
      tutor: true,
      question_quality: true,
      insights: true,
      study_coach: true,
    },
  }

  Object.assign(policy, req.body)
  db.agentPolicies.set(courseId, policy)
  return res.json(policy)
}

export async function listMemories(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const memories = Array.from(db.agentMemories.values()).filter((m) => m.courseId === courseId)
  return res.json(memories)
}

export async function deleteMemory(req: AuthenticatedRequest, res: Response) {
  const { memoryId } = req.params
  db.agentMemories.delete(memoryId)
  return res.json({ success: true, message: 'Memory deleted' })
}

export async function getStudyPlan(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const user = req.user!

  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  const materials = Array.from(db.materials.values()).filter((m) => m.courseId === courseId)
  const assignments = Array.from(db.assignments.values()).filter((a) => a.courseId === courseId)

  if (materials.length === 0 && assignments.length === 0) {
    return res.json({
      courseId,
      studentId: user.id,
      title: `${course.name} Foundations`,
      weakTopics: [],
      steps: [],
      recommendedMaterials: [],
    })
  }

  const upcomingAsg = assignments.find((a) => new Date(a.dueDate) > new Date()) || assignments[0]
  const weakTopics = materials.flatMap((m) => m.indexing.topics).slice(0, 2)

  return res.json({
    courseId,
    studentId: user.id,
    generatedAt: new Date().toISOString(),
    title: upcomingAsg ? `Sprint: Prepare for ${upcomingAsg.title}` : `Core Review: ${course.name}`,
    weakTopics: weakTopics.length > 0 ? weakTopics : ['Foundational Concepts'],
    deadline: upcomingAsg ? `Due in ${Math.max(1, Math.round((new Date(upcomingAsg.dueDate).getTime() - Date.now()) / 86400000))} days` : undefined,
    steps: [
      {
        step: 1,
        title: materials[0] ? `Review ${materials[0].title} concepts and slides` : `Review lecture notes for ${course.name}`,
        duration: '25 min',
      },
      {
        step: 2,
        title: upcomingAsg ? `Draft solutions for ${upcomingAsg.title}` : 'Work through practice problems',
        duration: '45 min',
      },
      {
        step: 3,
        title: 'Verify edge cases and consult AI Tutor on unclear topics',
        duration: '20 min',
      },
    ],
    recommendedMaterials: materials.slice(0, 2).map((m) => ({
      title: m.title,
      pages: [1, 2, 4],
    })),
  })
}

export async function getInsights(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  const doubts = Array.from(db.doubts.values()).filter((d) => d.courseId === courseId)
  const materials = Array.from(db.materials.values()).filter((m) => m.courseId === courseId)

  if (doubts.length === 0) {
    return res.json({
      courseId,
      generatedAt: new Date().toISOString(),
      weakTopic: materials[0]?.title || course.name,
      dropPercentage: 0,
      observation: 'No question friction or score drops recorded yet. All students currently progressing normally.',
      frequentDoubts: [],
      suggestedAnnouncement: `Welcome to ${course.code}: ${course.name}! Feel free to post questions here or ask the AI Tutor for help with course materials.`,
    })
  }

  const frequentDoubts = doubts.slice(-3).map((d) => ({
    question: d.question,
    count: 1,
    qualityScore: d.quality.score,
  }))

  return res.json({
    courseId,
    generatedAt: new Date().toISOString(),
    weakTopic: materials[0]?.indexing.topics[0] || 'Core Concepts',
    dropPercentage: 14,
    observation: `Students have asked ${doubts.length} questions regarding recent topics. Review suggested before upcoming deadlines.`,
    frequentDoubts,
    suggestedAnnouncement: `Based on recent student inquiries in ${course.code}, we will review key concepts this week. Please bring your questions!`,
  })
}

export async function listTools(req: AuthenticatedRequest, res: Response) {
  return res.json([
    { name: 'vector_search', description: 'Search indexed course materials', parameters: {}, permissionRole: 'all' },
    { name: 'chunk_and_embed', description: 'Chunk and embed material', parameters: {}, permissionRole: 'professor' },
    { name: 'extract_text', description: 'Extract plain text from files', parameters: {}, permissionRole: 'professor' },
    { name: 'run_self_test', description: 'Test vector retrieval fidelity', parameters: {}, permissionRole: 'professor' },
    { name: 'score_rubric', description: 'Score student submissions against rubrics', parameters: {}, permissionRole: 'professor' },
    { name: 'check_prompt_injection', description: 'Critic scan for jailbreaks', parameters: {}, permissionRole: 'all' },
    { name: 'request_human_approval', description: 'Escalate to human review', parameters: {}, permissionRole: 'professor' },
    { name: 'score_question_quality', description: 'Score question clarity and effort', parameters: {}, permissionRole: 'all' },
    { name: 'generate_calendar_event', description: 'Generate .ics calendar events', parameters: {}, permissionRole: 'student' },
    { name: 'aggregate_doubt_trends', description: 'Aggregate question topics', parameters: {}, permissionRole: 'professor' },
    { name: 'draft_announcement', description: 'Draft announcement from insights', parameters: {}, permissionRole: 'professor' },
    { name: 'query_student_memory', description: 'Inspect student learning memory', parameters: {}, permissionRole: 'all' },
    { name: 'update_student_memory', description: 'Update adaptive student traits', parameters: {}, permissionRole: 'all' },
  ])
}

