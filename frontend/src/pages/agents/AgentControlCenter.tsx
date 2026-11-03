/**
 * EXTENSION: Agent Control Center from /docs/AGENTIC_DESIGN.md B4 and B5.
 * Configure per-course agent autonomy, toggle auto-publishing of provisional feedback (D12),
 * set confidence thresholds (D11), and manage token budgets (D14).
 */
import React, { useState, useEffect } from 'react'
import { getAgentPolicy, updateAgentPolicy } from '@/services/agents'
import type { AgentName, AgentPolicy } from '@/types/agents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  Sliders,
  Shield,
  Cpu,
  Bot,
  Save,
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
  const [courseId, setCourseId] = useState('crs_cs301')
  const [policy, setPolicy] = useState<AgentPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const fetchPolicy = async () => {
    setLoading(true)
    try {
      const data = await getAgentPolicy(courseId)
      setPolicy(data)
    } catch {
      showToast('Failed to load agent policy.', 'error')
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
    if (!policy) return
    setSaving(true)
    try {
      await updateAgentPolicy(courseId, policy)
      showToast(`Agent autonomy settings saved for ${courseId}.`, 'success')
    } catch {
      showToast('Could not update policy.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const budgetPercent = policy
    ? Math.min(100, Math.round((policy.tokensUsedToday / policy.dailyTokenBudget) * 100))
    : 0

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">Agent Control Center</h1>
            <ExtensionTag label="Policy Engine" />
            <AIBadge label="Autonomous Guardrails" />
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
            <option value="crs_cs301">CS301 Database Systems</option>
            <option value="crs_cs220">CS220 Data Structures & Algorithms</option>
            <option value="crs_ai410">AI410 Machine Learning & Neural Networks</option>
          </select>

          <Button variant="primary" size="sm" disabled={saving || !policy} onClick={handleSave}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {loading || !policy ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-[8px]" />
          <Skeleton className="h-64 w-full rounded-[8px]" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Daily Budget & Governance Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="standard" className="border border-mist space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Daily Token Budget (D14)</span>
                <Cpu className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xl font-bold text-ink">
                {policy.tokensUsedToday.toLocaleString()} /{' '}
                {policy.dailyTokenBudget.toLocaleString()}
              </p>
              <div className="w-full bg-chalk rounded-full h-2 overflow-hidden border border-mist">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    budgetPercent > 80 ? 'bg-rose-500' : 'bg-accent'
                  }`}
                  style={{ width: `${budgetPercent}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 block font-mono">{budgetPercent}% consumed</span>
            </Card>

            <Card padding="standard" className="border border-mist space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Confidence Threshold (D11)</span>
                <Shield className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold text-ink">
                {(policy.confidenceThreshold * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-slate-400">
                Grades below this threshold require professor approval before release.
              </p>
            </Card>

            <Card padding="standard" className="border border-mist space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Provisional Feedback (D12)</span>
                <Bot className="w-4 h-4 text-accent" />
              </div>
              <p className="text-xl font-bold text-ink">
                {policy.autoPublish ? 'Provisional Visible' : 'Hidden Until Approved'}
              </p>
              <p className="text-xs text-slate-400">
                Marks always require approval; controls student preview visibility.
              </p>
            </Card>
          </div>

          {/* Autonomy Controls & Sliders */}
          <Card padding="standard" className="border border-mist space-y-6">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              Human Governance & Policy Configuration
            </h3>

            <div className="space-y-4">
              {/* Confidence Threshold Slider */}
              <div className="p-4 rounded-[8px] bg-chalk border border-mist space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-ink">
                  <span>Grader Confidence Gate Threshold</span>
                  <span className="font-mono text-accent">
                    {(policy.confidenceThreshold * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.95"
                  step="0.05"
                  value={policy.confidenceThreshold}
                  onChange={(e) =>
                    setPolicy({ ...policy, confidenceThreshold: Number(e.target.value) })
                  }
                  className="w-full accent-accent cursor-pointer"
                />
                <p className="text-xs text-slate-500">
                  Submissions with model confidence below {(policy.confidenceThreshold * 100).toFixed(0)}%
                  will automatically route to the professor Approval Queue.
                </p>
              </div>

              {/* Auto-publish Provisional Feedback Switch */}
              <div className="p-4 rounded-[8px] bg-chalk border border-mist flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-ink block">
                    Show Provisional AI Feedback to Students (Decision D12)
                  </span>
                  <p className="text-xs text-slate-500 max-w-xl">
                    When enabled, students immediately see provisional AI evaluation notes labeled
                    "AI, pending review". Numerical marks remain locked until professor approval.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPolicy({ ...policy, autoPublish: !policy.autoPublish })}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    policy.autoPublish ? 'bg-accent' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                      policy.autoPublish ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>

          {/* Specialist Agents Activation Toggles */}
          <Card padding="standard" className="border border-mist space-y-4">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Bot className="w-4 h-4 text-accent" />
              Specialist Agent Activation Roster (Section B1)
            </h3>
            <p className="text-xs text-slate-500">
              Selectively enable or disable autonomous specialist agents for {courseId}. Disabled
              agents are rejected by policy guardrails.
            </p>

            <div className="divide-y divide-mist">
              {AGENT_LIST.map((agent) => {
                const isEnabled = policy.enabledAgents[agent.id] ?? true
                return (
                  <div key={agent.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{agent.name}</span>
                        <Badge variant={isEnabled ? 'success' : 'neutral'}>
                          {isEnabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{agent.desc}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAgent(agent.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        isEnabled ? 'bg-accent' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 left-1 ${
                          isEnabled ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
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
