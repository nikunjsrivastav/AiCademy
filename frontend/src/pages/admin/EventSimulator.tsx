/**
 * EXTENSION: Orchestrator Event Simulator page from /docs/AGENTIC_DESIGN.md B1.1 and B6.
 * Dispatches simulated events to the Orchestrator and visualizes agent routing decisions.
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { startAgentRun } from '@/services/agents'
import { listCourses } from '@/services/courses'
import type { Course } from '@/types/domain'
import type { AgentEventType, SimulationMode } from '@/types/agents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { useToast } from '@/components/ui/Toast'
import {
  Zap,
  Play,
  ExternalLink,
  Activity,
} from 'lucide-react'

const EVENT_TYPES: {
  event: AgentEventType
  label: string
  desc: string
  routedTo: string
}[] = [
  {
    event: 'material.uploaded',
    label: 'material.uploaded',
    desc: 'New syllabus or lecture slides uploaded. Dispatches Ingestion Agent.',
    routedTo: 'Ingestion Agent',
  },
  {
    event: 'submission.created',
    label: 'submission.created',
    desc: 'Student submitted assignment. Dispatches Grader Agent with rubric review.',
    routedTo: 'Grader Agent',
  },
  {
    event: 'doubt.asked',
    label: 'doubt.asked',
    desc: 'Student asked question. Dispatches Tutor Agent RAG + Question Quality Agent.',
    routedTo: 'Tutor + Question Quality',
  },
  {
    event: 'weekly.tick',
    label: 'weekly.tick',
    desc: 'Weekly schedule trigger. Dispatches Insights Agent & Study Coach.',
    routedTo: 'Insights + Study Coach',
  },
  {
    event: 'deadline.approaching',
    label: 'deadline.approaching',
    desc: 'Assignment due in 48h. Dispatches Study Coach for deadline nudges.',
    routedTo: 'Study Coach Agent',
  },
]

export const EventSimulator: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<AgentEventType>('submission.created')
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('normal')
  const [submitting, setSubmitting] = useState(false)
  const [lastRunId, setLastRunId] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    listCourses()
      .then((list) => {
        setCourses(list)
        if (list.length > 0) setCourseId(list[0].id)
      })
      .catch(() => {})
  }, [])

  const handleDispatch = async () => {
    setSubmitting(true)
    try {
      const run = await startAgentRun({
        agent: 'orchestrator',
        courseId,
        trigger: {
          kind: 'event',
          event: selectedEvent,
          description: `Dispatched event '${selectedEvent}' from Simulator Console`,
        },
        input: {
          event: selectedEvent,
          payload: {
            fileName: 'Curriculum_Lecture_Notes.pdf',
            assignmentId: 'asg_sim_1',
            submissionId: 'sub_sim_1',
            question: 'Explain 2-Phase Locking vs Strict 2PL',
          },
        },
        simulation: simulationMode,
      })

      setLastRunId(run.id)
      showToast(`Run ${run.id} created. Orchestrator routing to specialist agents.`, 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">Orchestrator Event Simulator</h1>
            <ExtensionTag label="B6 Triggers" />
            <AIBadge label="Multi-Agent Pipeline" />
          </div>
          <p className="text-sm text-slate-500">
            Dispatch asynchronous domain events to observe autonomous Orchestrator routing and specialist pipelines.
          </p>
        </div>

        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="text-xs bg-chalk border border-mist rounded-[6px] px-3 py-2 text-ink font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
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

      {/* Simulator Control Card */}
      <Card padding="standard" className="border border-mist space-y-6">
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          Event Dispatch Parameters
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">Select Event Trigger (B6)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EVENT_TYPES.map((et) => {
                const isSelected = selectedEvent === et.event
                return (
                  <button
                    key={et.event}
                    type="button"
                    onClick={() => setSelectedEvent(et.event)}
                    className={`p-3.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent-soft/40 shadow-xs'
                        : 'border-mist bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-accent">{et.label}</span>
                      <Badge variant="neutral">→ {et.routedTo}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{et.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1.5">
              Simulation Scenario (Decision D15)
            </label>
            <select
              value={simulationMode}
              onChange={(e) => setSimulationMode(e.target.value as SimulationMode)}
              className="w-full text-sm bg-chalk border border-mist rounded-[8px] p-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="normal">Normal (Happy path routing and high-confidence outputs)</option>
              <option value="low_confidence">
                Low Confidence (Produces borderline results routing to professor approval)
              </option>
              <option value="failure">
                Failure / Adversarial (Flags prompt injection or out-of-scope query)
              </option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Targets: {courseId} • Orchestrator Agent
            </span>
            <Button variant="primary" size="md" disabled={submitting} onClick={handleDispatch}>
              <Play className="w-4 h-4" />
              {submitting ? 'Dispatching...' : 'Fire Event Trigger'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Dispatched Result Banner */}
      {lastRunId && (
        <Card padding="standard" className="border border-emerald-300 bg-emerald-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
              <Activity className="w-4 h-4 text-emerald-600" />
              Event Received by Orchestrator
            </div>
            <Link
              to={`/agents/traces/${lastRunId}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
            >
              Inspect Live Trace <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-slate-600 font-mono">
            Run ID: {lastRunId} • Status: Dispatched • Event: {selectedEvent}
          </p>
        </Card>
      )}
    </div>
  )
}
