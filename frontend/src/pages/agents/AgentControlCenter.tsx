/**
 * EXTENSION: Agent Control Center from /docs/AGENTIC_DESIGN.md B4 and B5.
 * Configure per-course agent autonomy, toggle auto-publishing of provisional feedback (D12),
 * set confidence thresholds (D11), and manage token budgets (D14).
 */
import React, { useState, useEffect } from 'react'
import { getAgentPolicy, updateAgentPolicy } from '@/services/agents'
import { listCourses } from '@/services/courses'
import type { AgentName, AgentPolicy } from '@/types/agents'
import type { Course } from '@/types/domain'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import {
  Shield,
  Cpu,
  Bot,
  Save,
  BookOpen,
} from 'lucide-react'

const AGENT_LIST: { id: AgentName; name: string; desc: string }[] = [
  { id: 'orchestrator', name: 'Orchestrator Agent', desc: 'Event router and multi-agent workflow coordinator.' },
  { id: 'ingestion', name: 'Ingestion Agent', desc: 'Extracts documents, creates vector chunks, and tests retrieval quality.' },
  { id: 'grader', name: 'Grader Agent', desc: 'Evaluates submissions against rubrics and detects prompt injection (D13).' },
  { id: 'tutor', name: 'Tutor Agent', desc: 'Answers student doubts via agentic RAG with citations and honest refusal.' },
  { id: 'question_quality', name: 'Question Quality Agent', desc: 'Scores clarity and effort of inquiries, providing coaching tips.' },
  { id: 'insights', name: 'Insights Agent', desc: 'Curriculum copilot detecting concept friction and drafting review sessions.' },
  { id: 'study_coach', name: 'Study Coach Agent', desc: 'Generates personalized student mastery sprints and deadline nudges.' },
]

export const AgentControlCenter: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState<string>('')
  const [policy, setPolicy] = useState<AgentPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  // 1. Fetch real courses
  useEffect(() => {
    let mounted = true
    const loadCourses = async () => {
      setCoursesLoading(true)
      try {
        const list = await listCourses()
        if (mounted) {
          setCourses(list)
          if (list.length > 0) {
            setCourseId(list[0].id)
          }
        }
      } catch {
        if (mounted) showToast('Failed to load courses.', 'error')
      } finally {
        if (mounted) setCoursesLoading(false)
      }
    }
    loadCourses()
    return () => {
      mounted = false
    }
  }, [])

  const fetchPolicy = async () => {
    if (!courseId) {
      setPolicy(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getAgentPolicy(courseId)
      const normalized: AgentPolicy = {
        courseId: data?.courseId || courseId,
        enabledAgents: data?.enabledAgents || (data as any)?.activeAgents || {
          orchestrator: true,
          ingestion: true,
          grader: true,
          tutor: true,
          question_quality: true,
          insights: true,
          study_coach: true,
        },
        autoPublish: data?.autoPublish ?? (data as any)?.autoPublishAnnouncements ?? false,
        confidenceThreshold: data?.confidenceThreshold ?? (data as any)?.minConfidenceGrader ?? 0.85,
        dailyTokenBudget: data?.dailyTokenBudget ?? 500000,
        tokensUsedToday: data?.tokensUsedToday ?? (data as any)?.usedTokensToday ?? 0,
        updatedAt: data?.updatedAt || new Date().toISOString(),
      }
      setPolicy(normalized)
    } catch {
      setPolicy({
        courseId,
        enabledAgents: {
          orchestrator: true,
          ingestion: true,
          grader: true,
          tutor: true,
          question_quality: true,
          insights: true,
          study_coach: true,
        },
        autoPublish: false,
        confidenceThreshold: 0.85,
        dailyTokenBudget: 500000,
        tokensUsedToday: 0,
        updatedAt: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicy()
  }, [courseId])

  const handleToggleAgent = (agent: AgentName) => {
    if (!policy) return
    setPolicy({
      ...policy,
      enabledAgents: {
        ...policy.enabledAgents,
        [agent]: !policy.enabledAgents[agent],
      },
    })
  }

  const handleSave = async () => {
    if (!policy || !courseId) return
    setSaving(true)
    try {
      await updateAgentPolicy(courseId, policy)
      showToast('Agent policy saved successfully.', 'success')
    } catch {
      showToast('Failed to save policy.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (coursesLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-12 w-64 rounded-[8px]" />
        <Skeleton className="h-40 w-full rounded-[8px]" />
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl font-bold text-ink">Agent Control Center</h1>
          <p className="text-sm text-slate-500">
            Define course agent activation, provisional feedback visibility, confidence thresholds, and token budgets.
          </p>
        </div>
        <Card padding="standard" className="border border-mist">
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-accent" />}
            title="No Courses Found"
            description="Create a course first in Course Studio to configure agent governance policies."
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">Agent Control Center</h1>
            <ExtensionTag label="Governance & Safety" />
            <AIBadge label="Policy Engine" />
          </div>
          <p className="text-sm text-slate-500">
            Define course agent activation, provisional feedback visibility, confidence thresholds,
            and token budgets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="text-xs bg-chalk border border-mist rounded-[6px] px-3 py-2 text-ink font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.name}
              </option>
            ))}
          </select>

          <Button variant="primary" size="sm" disabled={saving || !policy} onClick={handleSave}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {loading || !policy ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-[8px]" />
          <Skeleton className="h-64 w-full rounded-[8px]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Autonomy & Safety Settings Card */}
          <Card padding="standard" className="border border-mist space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Human-in-the-Loop & Feedback Policies
                </h3>
                <p className="text-xs text-slate-500">
                  Enforce strict ethical boundaries and determine when AI operates autonomously.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Auto Publish Feedback Toggle */}
              <div className="p-4 rounded-[8px] bg-chalk border border-mist space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">Auto-Publish Student Feedback</span>
                  <input
                    type="checkbox"
                    checked={policy.autoPublish}
                    onChange={(e) =>
                      setPolicy({ ...policy, autoPublish: e.target.checked })
                    }
                    className="w-4 h-4 text-accent rounded focus:ring-accent"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-ink">Decision D12:</span> Shows provisional AI
                  evaluation comments to students immediately, labeled "Pending Professor Approval".
                  Final numeric marks are strictly withheld until professor approval.
                </p>
              </div>

              {/* Confidence Threshold Slider */}
              <div className="p-4 rounded-[8px] bg-chalk border border-mist space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">Approval Confidence Threshold</span>
                  <Badge variant="brand">{(((policy.confidenceThreshold ?? 0.85)) * 100).toFixed(0)}%</Badge>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.99"
                  step="0.01"
                  value={policy.confidenceThreshold ?? 0.85}
                  onChange={(e) =>
                    setPolicy({ ...policy, confidenceThreshold: parseFloat(e.target.value) })
                  }
                  className="w-full accent-accent"
                />
                <p className="text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-ink">Decision D11:</span> Submissions graded with
                  confidence below this threshold are routed to the human approval queue. Bulk approval
                  requires &ge; 90%.
                </p>
              </div>
            </div>

            {/* Token Budget Meter */}
            <div className="p-4 rounded-[8px] bg-chalk border border-mist space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-ink">Daily Course Token Budget (D14)</span>
                  <p className="text-xs text-slate-500">
                    Controls daily LLM token consumption to prevent unexpected API costs.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-accent">
                  {(policy.tokensUsedToday || 0).toLocaleString()} /{' '}
                  {(policy.dailyTokenBudget || 500000).toLocaleString()} tokens
                </span>
              </div>
              <div className="w-full bg-mist/60 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      ((policy.tokensUsedToday || 0) / (policy.dailyTokenBudget || 500000)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Specialist Agent Toggles */}
          <Card padding="standard" className="border border-mist space-y-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" />
                Active Agent Services (Decision D14)
              </h3>
              <p className="text-xs text-slate-500">
                Enable or disable individual agent pipelines for this course.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {AGENT_LIST.map((agent) => {
                const isEnabled = policy.enabledAgents ? Boolean(policy.enabledAgents[agent.id]) : true
                return (
                  <div
                    key={agent.id}
                    className="p-3.5 rounded-[8px] bg-chalk border border-mist flex items-start justify-between gap-4 hover:border-accent/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-accent shrink-0" />
                        <span className="text-sm font-bold text-ink">{agent.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{agent.desc}</p>
                    </div>

                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggleAgent(agent.id)}
                      className="w-4 h-4 text-accent rounded focus:ring-accent mt-0.5 shrink-0"
                    />
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
