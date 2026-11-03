/**
 * EXTENSION: Agent Runs Dashboard page from /docs/AGENTIC_DESIGN.md B4 and B5.
 * Lists all agent runs with filter controls and a modal to trigger live runs.
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listAgentRuns, startAgentRun } from '@/services/agents'
import { listCourses } from '@/services/courses'
import type { Course } from '@/types/domain'
import type { AgentName, AgentRun, SimulationMode } from '@/types/agents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AIBadge } from '@/components/ui/AIBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import {
  Bot,
  Play,
  Clock,
  Coins,
  Cpu,
  ChevronRight,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

export const AgentRunsList: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [agentFilter, setAgentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showRunModal, setShowRunModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  // New Run Form State
  const [selectedAgent, setSelectedAgent] = useState<AgentName>('ingestion')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('normal')

  const fetchRuns = async () => {
    setLoading(true)
    try {
      const data = await listAgentRuns()
      setRuns(data)
    } catch {
      showToast('Failed to load agent runs.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRuns()
    listCourses().then((list) => {
      setCourses(list)
      if (list.length > 0) setSelectedCourse(list[0].id)
    }).catch(() => {})
  }, [])

  const handleTriggerRun = async () => {
    setSubmitting(true)
    try {
      const run = await startAgentRun({
        agent: selectedAgent,
        courseId: selectedCourse,
        trigger: {
          kind: 'manual',
          description: `Manual launch of ${selectedAgent} (${simulationMode})`,
        },
        input: {
          fileName: 'Curriculum_Module.pdf',
          materialId: 'mat_run_1',
          assignmentId: 'asg_demo_1',
          submissionId: 'sub_demo_1',
          question: 'What is Boyce-Codd Normal Form and how does it prevent anomalies?',
        },
        simulation: simulationMode,
      })

      showToast(`${selectedAgent} agent run ${run.id} started.`, 'success')
      setShowRunModal(false)
      fetchRuns()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = runs.filter((r) => {
    if (agentFilter !== 'all' && r.agent !== agentFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-fg">Agent Control & Runs Trace</h1>
            <AIBadge />
          </div>
          <p className="text-sm text-muted">
            Audit autonomous tool-using specialist agents, step reasoning, and token consumption.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchRuns} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowRunModal(true)}>
            <Play className="w-4 h-4" />
            Dispatch Agent Run
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card padding="compact" className="border border-line bg-surface flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <Filter className="w-4 h-4" />
          Filter By:
        </div>

        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="text-xs bg-surface-2 border border-line rounded-[6px] px-3 py-1.5 text-fg focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All Agents</option>
          <option value="orchestrator">Orchestrator</option>
          <option value="ingestion">Ingestion</option>
          <option value="grader">Grader</option>
          <option value="tutor">Tutor</option>
          <option value="question_quality">Question Quality</option>
          <option value="insights">Insights</option>
          <option value="study_coach">Study Coach</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-chalk border border-mist rounded-[6px] px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All Statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="running">Running</option>
          <option value="waiting_for_approval">Waiting for Approval</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto font-mono">
          Showing {filtered.length} of {runs.length} runs
        </span>
      </Card>

      {/* Runs List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-[8px]" />
          <Skeleton className="h-20 w-full rounded-[8px]" />
          <Skeleton className="h-20 w-full rounded-[8px]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Bot className="w-8 h-8 text-accent" />}
          title="No Agent Runs Match Criteria"
          description="Trigger a new run using the button above to observe autonomous execution."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((run) => (
            <Link
              key={run.id}
              to={`/agents/traces/${run.id}`}
              className="block rounded-[8px] border border-mist bg-white hover:border-accent/40 hover:shadow-xs transition-all p-4 cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="p-1.5 rounded-[6px] bg-accent-soft text-accent">
                      <Bot className="w-4 h-4" />
                    </span>
                    <span className="text-sm font-bold text-ink capitalize">
                      {run.agent.replace('_', ' ')} Agent
                    </span>
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
                      <Badge variant="warning">{run.simulation}</Badge>
                    )}
                    <span className="text-xs font-mono text-slate-400">{run.id}</span>
                  </div>

                  <p className="text-xs text-slate-500 font-sans">
                    {run.trigger.description || 'Automated event execution'}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 shrink-0">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{run.stepCount} steps</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" />
                    <span>{run.usage.totalTokens} tok</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-slate-400" />
                    <span>${run.usage.estimatedCostUsd.toFixed(4)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Trigger Run Modal */}
      <Modal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        title="Dispatch Agent Execution Run"
        description="Execute an autonomous specialist agent with inspectable trace streaming."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Specialist Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value as AgentName)}
              className="w-full text-sm bg-chalk border border-mist rounded-[8px] p-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="ingestion">Ingestion Agent (Extract, Chunk, Embed, Self-Test)</option>
              <option value="grader">Grader Agent (Rubric Evaluation, Injection Defense)</option>
              <option value="tutor">Tutor Agent (Agentic RAG, Grounding, Citations)</option>
              <option value="question_quality">Question Quality Agent (Clarity & Effort)</option>
              <option value="insights">Insights Agent (Curriculum Copilot & Drafts)</option>
              <option value="study_coach">Study Coach Agent (Personalized Mastery Sprint)</option>
              <option value="orchestrator">Orchestrator Agent (Multi-Agent Dispatch)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">Target Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full text-sm bg-chalk border border-mist rounded-[8px] p-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {courses.length === 0 ? (
                <option value="">No courses created yet</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Simulation Scenario
            </label>
            <select
              value={simulationMode}
              onChange={(e) => setSimulationMode(e.target.value as SimulationMode)}
              className="w-full text-sm bg-chalk border border-mist rounded-[8px] p-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="normal">Normal (Happy path execution with high confidence)</option>
              <option value="low_confidence">
                Low Confidence (Borderline result triggering approval / honest referral)
              </option>
              <option value="failure">
                Failure / Adversarial (Simulated error / Prompt injection flagged)
              </option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRunModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={submitting}
              onClick={handleTriggerRun}
            >
              <Sparkles className="w-4 h-4" />
              {submitting ? 'Dispatching...' : 'Launch Agent'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
