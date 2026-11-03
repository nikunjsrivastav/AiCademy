/**
 * EXTENSION: Human-in-the-Loop Approval Queue from /docs/AGENTIC_DESIGN.md B3 and Decision D11, D12.
 * Allows professors to review AI-graded submissions, check confidence indicators, override marks,
 * and approve agent-drafted announcements. Includes bulk-approve for confidence >= 0.90.
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listApprovals, decideApproval } from '@/services/agents'
import { listCourses } from '@/services/courses'
import type { Course } from '@/types/domain'
import type { ApprovalRequest } from '@/types/agents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Edit3,
  Bot,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react'

export const ApprovalQueue: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string>('all')

  useEffect(() => {
    listCourses().then(setCourses).catch(() => {})
  }, [])
  const [activeModal, setActiveModal] = useState<{
    type: 'approve' | 'reject' | 'edit'
    item: ApprovalRequest
  } | null>(null)
  const [decisionNote, setDecisionNote] = useState('')
  const [overrideMarks, setOverrideMarks] = useState<number>(85)
  const [submitting, setSubmitting] = useState(false)
  const { showToast } = useToast()

  const fetchApprovals = async () => {
    setLoading(true)
    try {
      const data = await listApprovals(selectedCourse === 'all' ? undefined : selectedCourse)
      setApprovals(data)
    } catch {
      showToast('Failed to load approvals queue.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [selectedCourse])

  const handleDecision = async () => {
    if (!activeModal) return
    setSubmitting(true)
    try {
      const payloadOverride =
        activeModal.type === 'edit'
          ? { marks: overrideMarks, approvedFeedback: decisionNote || 'Adjusted by professor.' }
          : undefined

      await decideApproval(activeModal.item.id, {
        decision: activeModal.type === 'edit' ? 'edit' : activeModal.type,
        note: decisionNote,
        payloadOverride,
      })

      showToast(`Approval request ${activeModal.item.id} has been ${activeModal.type}d.`, 'success')
      setActiveModal(null)
      setDecisionNote('')
      fetchApprovals()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkApprove = async () => {
    // Bulk approve only items with confidence >= 0.90 (Decision D11)
    const eligible = approvals.filter(
      (a) => a.status === 'pending' && (a.confidence ?? 0) >= 0.9
    )
    if (eligible.length === 0) {
      showToast('No pending items meet the 90%+ confidence threshold for bulk approval (D11).', 'info')
      return
    }

    setSubmitting(true)
    try {
      for (const item of eligible) {
        await decideApproval(item.id, {
          decision: 'approve',
          note: 'Bulk approved (confidence >= 0.90 per D11).',
        })
      }
      showToast(`Approved ${eligible.length} high-confidence requests.`, 'success')
      fetchApprovals()
    } catch {
      showToast('An error occurred during bulk approval.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const pending = approvals.filter((a) => a.status === 'pending')
  const highConfidencePending = pending.filter((a) => (a.confidence ?? 0) >= 0.9)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">Human-in-the-Loop Approval Queue</h1>
            <ExtensionTag label="Governance" />
            <AIBadge label="Strict Human Gate" />
          </div>
          <p className="text-sm text-slate-500">
            Agents propose grades and announcements; human professors accept, override, or reject
            (Decision D11, D12).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleBulkApprove}
            disabled={submitting || highConfidencePending.length === 0}
          >
            <ShieldCheck className="w-4 h-4" />
            Bulk Approve (90%+ Conf) ({highConfidencePending.length})
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <Card padding="compact" className="border border-mist flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Filter className="w-4 h-4" />
          Filter Course:
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="text-xs bg-chalk border border-mist rounded-[6px] px-3 py-1.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}: {c.name}
            </option>
          ))}
        </select>

        <span className="text-xs text-slate-400 ml-auto font-mono">
          {pending.length} pending decisions
        </span>
      </Card>

      {/* Approvals List */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-[8px]" />
          <Skeleton className="h-28 w-full rounded-[8px]" />
          <Skeleton className="h-28 w-full rounded-[8px]" />
        </div>
      ) : pending.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
          title="All Caught Up!"
          description="No pending agent actions require approval. All submissions and announcements have been reviewed."
        />
      ) : (
        <div className="space-y-3">
          {pending.map((item) => {
            const isFlagged = item.flags && item.flags.length > 0

            return (
              <div
                key={item.id}
                className={`rounded-[8px] border transition-all p-5 ${
                  isFlagged
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-white border-mist hover:border-accent/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="p-1.5 rounded-[6px] bg-accent-soft text-accent">
                        <Bot className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-mono font-bold text-accent px-2 py-0.5 bg-accent-soft rounded-[4px]">
                        {item.proposedAction.kind.replace('_', ' ')}
                      </span>
                      <h3 className="text-sm font-bold text-ink">{item.summary}</h3>
                      {item.confidence !== undefined && (
                        <ConfidenceBadge
                          confidence={{
                            score: item.confidence,
                            level: item.confidence >= 0.85 ? 'high' : item.confidence >= 0.7 ? 'medium' : 'low',
                          }}
                        />
                      )}
                      {isFlagged && (
                        <Badge variant="danger">
                          <AlertTriangle className="w-3 h-3 mr-1 inline" />
                          Flagged for Audit
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-mono">
                      Course: {item.courseId} • Target: {item.proposedAction.targetId} • Requested{' '}
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>

                    {/* Proposed Action Payload Preview */}
                    <div className="mt-2 p-3 rounded-[6px] bg-chalk border border-mist text-xs font-mono text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-500 font-sans block mb-1">
                        Agent Proposal:
                      </span>
                      {item.proposedAction.kind === 'finalize_grade' ? (
                        <p>
                          Proposed Grade:{' '}
                          <span className="font-bold text-accent">
                            {(item.proposedAction.payload as any).marks ?? 85}/100
                          </span>{' '}
                          • Feedback: "{(item.proposedAction.payload as any).approvedFeedback || 'Rubric verification passed'}"
                        </p>
                      ) : (
                        <p>
                          Title: "{(item.proposedAction.payload as any).title}" • Content: "
                          {(item.proposedAction.payload as any).content?.slice(0, 80)}..."
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    <Link
                      to={`/agents/traces/${item.runId}`}
                      className="p-2 rounded-[6px] border border-mist text-slate-600 hover:text-accent hover:border-accent text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      title="Inspect Step-by-Step Agent Trace"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Trace
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOverrideMarks((item.proposedAction.payload as any).marks ?? 85)
                        setActiveModal({ type: 'edit', item })
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Override
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveModal({ type: 'reject', item })}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveModal({ type: 'approve', item })}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Decision Modal */}
      {activeModal && (
        <Modal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={
            activeModal.type === 'approve'
              ? 'Approve Proposed Action'
              : activeModal.type === 'reject'
              ? 'Reject Proposed Action'
              : 'Override Proposed Score & Feedback'
          }
          description={`Run ID: ${activeModal.item.runId} • Target: ${activeModal.item.proposedAction.targetId}`}
        >
          <div className="space-y-4">
            {activeModal.type === 'edit' && (
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Override Marks (out of 100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overrideMarks}
                  onChange={(e) => setOverrideMarks(Number(e.target.value))}
                  className="w-full text-sm bg-chalk border border-mist rounded-[8px] p-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                {activeModal.type === 'edit'
                  ? 'Final Feedback for Student'
                  : 'Professor Note (Audit Log)'}
              </label>
              <textarea
                rows={3}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder={
                  activeModal.type === 'approve'
                    ? 'Approved without changes.'
                    : activeModal.type === 'reject'
                    ? 'State reason for rejecting proposal...'
                    : 'Enter custom feedback and rubric commentary...'
                }
                className="w-full text-sm bg-chalk border border-mist rounded-[8px] p-2.5 text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                variant={activeModal.type === 'reject' ? 'outline' : 'primary'}
                size="sm"
                disabled={submitting}
                onClick={handleDecision}
              >
                {submitting ? 'Recording...' : 'Confirm Decision'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
