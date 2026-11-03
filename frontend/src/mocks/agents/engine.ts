/**
 * EXTENSION: Simulated Agent Engine from /docs/AGENTIC_DESIGN.md B4 and B7.
 * Executes async generator agent scripts yielding typed AgentSteps.
 * Enforces guardrails: step caps, retry limits, daily token budget, course policy.
 * TODO(agent-runtime): ported to LangGraph in ROADMAP Phase 4.
 */
import type {
  AgentName,
  AgentRun,
  AgentStep,
  AutonomyLevel,
  RunTrigger,
  SimulationMode,
  StepStatus,
  StepType,
  TokenUsage,
  ToolName,
} from '@/types/agents'
import type { Role } from '@/types/domain'
import { getDb, newId, saveDb } from '../db/store'
import { estimateTokenUsage, addTokenUsage } from './pricing'
import { toolRegistry, type ToolExecutionContext } from './registry'

export interface AgentContext {
  actorId: string
  actorRole: Role
  courseId: string
  simulation?: SimulationMode
  parentRunId?: string
}

export interface ScriptYieldStep {
  type: StepType
  content: string
  toolName?: ToolName
  input?: unknown
  output?: unknown
  status?: StepStatus
  autonomy?: AutonomyLevel
  requiresApproval?: boolean
}

export type AgentScript = (
  input: any,
  ctx: AgentContext & { runId: string }
) => AsyncGenerator<ScriptYieldStep, unknown, unknown>

// Map of registered agent scripts
const registeredScripts: Partial<Record<AgentName, AgentScript>> = {}

export function registerAgentScript(name: AgentName, script: AgentScript): void {
  registeredScripts[name] = script
}

const MAX_STEPS = 12 // Decision D14
const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test'

function delay(ms: number): Promise<void> {
  if (isTestEnv) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class AgentEngine {
  /**
   * Start an asynchronous agent execution.
   */
  async startRun(
    agentName: AgentName,
    trigger: RunTrigger,
    input: any,
    ctx: AgentContext
  ): Promise<AgentRun> {
    const db = getDb()
    const runId = newId('run')
    const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`

    // Policy check: is agent enabled for this course?
    const policy = db.policies.find((p) => p.courseId === ctx.courseId)
    if (policy && policy.enabledAgents && policy.enabledAgents[agentName] === false) {
      const rejectedRun: AgentRun = {
        id: runId,
        requestId,
        agent: agentName,
        trigger,
        status: 'failed',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        courseId: ctx.courseId,
        actorId: ctx.actorId,
        parentRunId: ctx.parentRunId,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
        finalOutput: null,
        error: `Agent ${agentName} is disabled by course policy`,
        simulation: ctx.simulation || 'normal',
        stepCount: 0,
      }
      db.agentRuns.unshift(rejectedRun)
      saveDb()
      return rejectedRun
    }

    // Check token budget
    if (policy && policy.tokensUsedToday >= policy.dailyTokenBudget) {
      const budgetRun: AgentRun = {
        id: runId,
        requestId,
        agent: agentName,
        trigger,
        status: 'failed',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        courseId: ctx.courseId,
        actorId: ctx.actorId,
        parentRunId: ctx.parentRunId,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
        finalOutput: null,
        error: `Daily token budget exceeded for course ${ctx.courseId}`,
        simulation: ctx.simulation || 'normal',
        stepCount: 0,
      }
      db.agentRuns.unshift(budgetRun)
      saveDb()
      return budgetRun
    }

    const run: AgentRun = {
      id: runId,
      requestId,
      agent: agentName,
      trigger,
      status: 'running',
      startedAt: new Date().toISOString(),
      endedAt: null,
      courseId: ctx.courseId,
      actorId: ctx.actorId,
      parentRunId: ctx.parentRunId,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
      finalOutput: null,
      simulation: ctx.simulation || 'normal',
      stepCount: 0,
    }

    db.agentRuns.unshift(run)
    saveDb()

    // Execute run script (synchronous in test environment, background in browser)
    const execPromise = this.executeScript(run, input, ctx)
    if (isTestEnv) {
      await execPromise
    }

    return run
  }

  private async executeScript(run: AgentRun, input: any, ctx: AgentContext): Promise<void> {
    const db = getDb()
    const script = registeredScripts[run.agent]

    if (!script) {
      run.status = 'failed'
      run.endedAt = new Date().toISOString()
      run.error = `No executable script registered for agent ${run.agent}`
      saveDb()
      return
    }

    const scriptCtx = { ...ctx, runId: run.id }
    const generator = script(input, scriptCtx)

    let stepIndex = 0
    let accumulatedUsage: TokenUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
    }

    try {
      while (true) {
        if (stepIndex >= MAX_STEPS) {
          run.status = 'failed'
          run.error = `Step limit reached (maximum ${MAX_STEPS} steps allowed per D14)`
          break
        }

        const stepStart = Date.now()
        // Artificial pacing for realistic streaming demo
        await delay(isTestEnv ? 0 : 250)

        const iter = await generator.next()
        if (iter.done) {
          run.finalOutput = iter.value
          if (run.status === 'running') {
            run.status = 'succeeded'
          }
          break
        }

        const rawStep = iter.value
        stepIndex += 1

        let toolOutput = rawStep.output
        let toolLatency = 15

        // If step calls a tool, execute through registry
        if (rawStep.toolName && rawStep.input) {
          const toolExecCtx: ToolExecutionContext = {
            actorId: ctx.actorId,
            actorRole: ctx.actorRole,
            courseId: ctx.courseId,
            runId: run.id,
          }

          const toolRes = await toolRegistry.call(rawStep.toolName, rawStep.input, toolExecCtx)
          toolLatency = toolRes.latencyMs
          toolOutput = toolRes.success ? toolRes.data : { error: toolRes.error }
        }

        const stepLatency = Date.now() - stepStart + toolLatency
        const stepUsage = estimateTokenUsage(
          typeof rawStep.input === 'string' ? rawStep.input : JSON.stringify(rawStep.input || ''),
          typeof rawStep.content === 'string' ? rawStep.content : ''
        )
        accumulatedUsage = addTokenUsage(accumulatedUsage, stepUsage)

        const stepRecord: AgentStep = {
          id: newId('step'),
          runId: run.id,
          index: stepIndex,
          type: rawStep.type,
          content: rawStep.content,
          toolName: rawStep.toolName,
          input: rawStep.input,
          output: toolOutput,
          latencyMs: stepLatency,
          status: rawStep.status || 'ok',
          autonomy: rawStep.autonomy || 'auto',
          createdAt: new Date().toISOString(),
        }

        db.agentSteps.push(stepRecord)
        run.stepCount = stepIndex
        run.usage = accumulatedUsage

        // Check if approval was requested
        if (rawStep.requiresApproval || rawStep.toolName === 'request_human_approval') {
          run.status = 'waiting_for_approval'
        }

        saveDb()

        if (run.status === 'waiting_for_approval') {
          // Pause execution until approved
          break
        }
      }
    } catch (err: unknown) {
      run.status = 'failed'
      run.error = err instanceof Error ? err.message : String(err)
    } finally {
      if (run.status !== 'waiting_for_approval') {
        run.endedAt = new Date().toISOString()
      }
      // Update policy token usage
      const pol = db.policies.find((p) => p.courseId === ctx.courseId)
      if (pol) {
        pol.tokensUsedToday += accumulatedUsage.totalTokens
      }
      saveDb()
    }
  }

  /**
   * Cancel an active or waiting agent run.
   */
  cancelRun(runId: string): AgentRun | null {
    const db = getDb()
    const run = db.agentRuns.find((r) => r.id === runId)
    if (!run) return null
    if (run.status === 'running' || run.status === 'waiting_for_approval' || run.status === 'queued') {
      run.status = 'cancelled'
      run.endedAt = new Date().toISOString()
      saveDb()
    }
    return run
  }
}

export const agentEngine = new AgentEngine()
