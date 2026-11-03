/**
 * EXTENSION: Agent Trace Viewer page from /docs/AGENTIC_DESIGN.md B4 and B7.
 * Renders live step-by-step reasoning traces, tool inputs/outputs, latency, and token cost breakdown.
 */
import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRunStream } from '@/hooks/useRunStream'
import { decideApproval, cancelAgentRun, listApprovals } from '@/services/agents'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AutonomyBadge } from '@/components/ui/AutonomyBadge'
import { AIBadge } from '@/components/ui/AIBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  Layers,
  Sparkles,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
} from 'lucide-react'

export const AgentTraceViewer: React.FC = () => {
  const { runId } = useParams<{ runId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { run, loading, error, refetch } = useRunStream(runId)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({})
  const [deciding, setDeciding] = useState(false)

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  const handleDecision = async (decision: 'approve' | 'reject') => {
    if (!run) return
    setDeciding(true)
    try {
      // Find matching approval request for this run
      const approvals = await listApprovals(run.courseId)
      const match = approvals.find((a: any) => a.runId === run.id && a.status === 'pending')

      if (match) {
        await decideApproval(match.id, { decision })
        showToast(`Run ${run.id} has been ${decision === 'approve' ? 'executed' : 'terminated'}.`, 'success')
        refetch()
      } else {
        showToast('Could not find pending approval record for this run.', 'error')
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setDeciding(false)
    }
  }

  const handleCancel = async () => {
    if (!run) return
    try {
      await cancelAgentRun(run.id)
      showToast(`Execution of ${run.id} stopped.`, 'info')
      refetch()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : String(err), 'error')
    }
  }

  if (loading && !run) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6">
        <Skeleton className="h-8 w-48 rounded-[8px]" />
        <Skeleton className="h-32 w-full rounded-[8px]" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-[8px]" />
          <Skeleton className="h-24 rounded-[8px]" />
          <Skeleton className="h-24 rounded-[8px]" />
          <Skeleton className="h-24 rounded-[8px]" />
        </div>
        <Skeleton className="h-96 w-full rounded-[8px]" />
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <ErrorState
          title="Run Trace Not Found"
          message={error || `Agent run "${runId}" does not exist or you lack permission to view it.`}
          onRetry={refetch}
        />
      </div>
    )
  }

  const durationMs = run.endedAt
    ? new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()
    : Date.now() - new Date(run.startedAt).getTime()

  const isTerminal = ['succeeded', 'failed', 'cancelled'].includes(run.status)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-ink transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <AIBadge label="Inspectable Reasoning" />
        </div>
      </div>

      {/* Header Banner */}
      <Card padding="standard" className="relative overflow-hidden border border-mist">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 rounded-[8px] bg-accent-soft text-accent">
                <Bot className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-ink capitalize tracking-tight">
                {run.agent.replace('_', ' ')} Agent Run
              </h1>
              <Badge
                variant={
                  run.status === 'succeeded'
                    ? 'success'
                    : run.status === 'failed'
                    ? 'danger'
                    : run.status === 'waiting_for_approval'
                    ? 'warning'
                    : 'info'
                }
              >
                {run.status.replace(/_/g, ' ')}
              </Badge>
              {run.simulation !== 'normal' && (
                <Badge variant="warning">Demo: {run.simulation}</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
              <span>Run ID: {run.id}</span>
              <span>•</span>
              <span>Request ID: {run.requestId}</span>
            </p>
          </div>

          {!isTerminal && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel Run
              </Button>
            </div>
          )}
        </div>

        {/* Human-in-the-Loop Approval Banner */}
        {run.status === 'waiting_for_approval' && (
          <div className="mt-5 p-4 rounded-[8px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Human Approval Required
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  This run proposes an action affecting grades or course announcements. Agent
                  execution is suspended until a professor approves.
                </p>
              </div>
            </div>
            {user?.role === 'professor' && (
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={deciding}
                  onClick={() => handleDecision('approve')}
                >
                  Approve & Finalize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deciding}
                  onClick={() => handleDecision('reject')}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Duration</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-ink">{(durationMs / 1000).toFixed(2)}s</p>
          <span className="text-xs text-slate-400">{run.stepCount} steps executed</span>
        </Card>

        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Tokens Used</span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-ink">{run.usage.totalTokens.toLocaleString()}</p>
          <span className="text-xs text-slate-400">
            {run.usage.promptTokens} in / {run.usage.completionTokens} out
          </span>
        </Card>

        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Estimated Cost</span>
            <Coins className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-ink">
            ${run.usage.estimatedCostUsd.toFixed(5)}
          </p>
          <span className="text-xs text-amber-600 font-medium">Estimated</span>
        </Card>

        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Course Context</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-ink">{run.courseId}</p>
          <span className="text-xs text-slate-400 truncate block">Actor: {run.actorId}</span>
        </Card>
      </div>

      {/* Step Trace Accordion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            Execution Trace ({run.steps.length} Steps)
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const allOpen = run.steps.every((s) => expandedSteps[s.id])
              const next: Record<string, boolean> = {}
              run.steps.forEach((s) => (next[s.id] = !allOpen))
              setExpandedSteps(next)
            }}
          >
            Toggle All Details
          </Button>
        </div>

        {run.steps.length === 0 ? (
          <Card padding="loose" className="text-center border border-mist">
            <Sparkles className="w-8 h-8 text-accent mx-auto mb-2 animate-spin" />
            <p className="text-sm font-medium text-ink">Initializing agent execution pipeline...</p>
            <p className="text-xs text-slate-500">Executing prompt plan and tool schema validation.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {run.steps.map((step) => {
              const isExpanded = expandedSteps[step.id] ?? false
              return (
                <div
                  key={step.id}
                  className={`rounded-[8px] border transition-all ${
                    step.type === 'tool_call'
                      ? 'bg-chalk border-mist'
                      : step.status === 'error'
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-mist'
                  }`}
                >
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-[6px] bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {step.index}
                      </span>
                      <Badge
                        variant={
                          step.type === 'plan'
                            ? 'info'
                            : step.type === 'tool_call'
                            ? 'brand'
                            : step.type === 'reflection'
                            ? 'warning'
                            : step.type === 'final'
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {step.type}
                      </Badge>
                      {step.toolName && (
                        <span className="text-xs font-mono font-semibold text-accent px-2 py-0.5 bg-accent-soft rounded-[4px] shrink-0">
                          {step.toolName}()
                        </span>
                      )}
                      <p className="text-sm font-medium text-ink truncate">{step.content}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                      <AutonomyBadge level={step.autonomy || 'auto'} />
                      <span>{step.latencyMs}ms</span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Step Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-mist/60 space-y-3 text-xs font-mono">
                      <div className="p-3 rounded-[6px] bg-slate-900 text-slate-100 overflow-x-auto">
                        <p className="text-slate-400 font-sans text-xs mb-1">Reasoning Content:</p>
                        <p className="font-sans text-sm leading-relaxed">{step.content}</p>
                      </div>

                      {step.input != null && (
                        <div>
                          <p className="text-slate-500 font-sans text-xs mb-1 font-semibold">
                            Tool Input Payload:
                          </p>
                          <pre className="p-3 rounded-[6px] bg-slate-100 dark:bg-slate-950 overflow-x-auto text-slate-800 dark:text-slate-200">
                            {JSON.stringify(step.input, null, 2)}
                          </pre>
                        </div>
                      )}

                      {step.output != null && (
                        <div>
                          <p className="text-slate-500 font-sans text-xs mb-1 font-semibold">
                            Observation / Tool Result:
                          </p>
                          <pre className="p-3 rounded-[6px] bg-slate-100 dark:bg-slate-950 overflow-x-auto text-slate-800 dark:text-slate-200">
                            {JSON.stringify(step.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Final Output Summary */}
      {Boolean(run.finalOutput) && (
        <Card padding="standard" className="border border-accent/30 bg-accent-soft/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <h3 className="text-base font-semibold text-ink">Validated Final Agent Output</h3>
          </div>
          <pre className="p-4 rounded-[8px] bg-white dark:bg-slate-900 border border-mist text-xs font-mono overflow-x-auto text-slate-800 dark:text-slate-200">
            {JSON.stringify(run.finalOutput, null, 2)}
          </pre>
        </Card>
      )}

      {/* Run Error */}
      {Boolean(run.error) && (
        <Card padding="standard" className="border border-rose-300 bg-rose-50/50">
          <div className="flex items-center gap-2 mb-2 text-rose-700">
            <XCircle className="w-5 h-5 shrink-0" />
            <h3 className="text-base font-semibold">Execution Terminated with Error</h3>
          </div>
          <p className="text-sm text-rose-900 font-mono">{run.error}</p>
        </Card>
      )}
    </div>
  )
}
