/**
 * EXTENSION: Teaching Insights Copilot page from /docs/AGENTIC_DESIGN.md B1.6.
 * Synthesizes student question clusters and score drops into curriculum recommendations,
 * with 1-click announcement publishing.
 */
import React, { useState, useEffect } from 'react'
import { getCourseInsights } from '@/services/agents'
import { createAnnouncement } from '@/services/announcements'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  Lightbulb,
  TrendingDown,
  MessageSquare,
  Send,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export const InsightsCopilot: React.FC = () => {
  const [courseId, setCourseId] = useState('crs_cs301')
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const { showToast } = useToast()

  const fetchInsights = async () => {
    setLoading(true)
    setPublished(false)
    try {
      const data = await getCourseInsights(courseId)
      setInsights(data)
    } catch {
      showToast('Failed to load teaching insights.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [courseId])

  const handlePublishSuggested = async () => {
    if (!insights) return
    setPublishing(true)
    try {
      await createAnnouncement({
        courseId,
        title: 'Revision Lab: Boyce-Codd Normal Form & Lossless Decomposition',
        content:
          'Based on recent questions, we will hold a 30-minute interactive review on BCNF decomposition and lossless joins this Thursday at 4 PM in Lab 3 or online. Bring your schema examples!',
      })
      setPublished(true)
      showToast('The AI-suggested revision session announcement has been posted to the class.', 'success')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">Teaching Insights Copilot</h1>
            <ExtensionTag label="Insights Agent" />
            <AIBadge label="Continuous Learning Data" />
          </div>
          <p className="text-sm text-slate-500">
            Autonomous curriculum analysis synthesizing student doubts, submission score patterns,
            and weak concepts.
          </p>
        </div>

        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="text-xs bg-chalk border border-mist rounded-[6px] px-3 py-2 text-ink font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="crs_cs301">CS301 Database Systems</option>
          <option value="crs_cs220">CS220 Data Structures & Algorithms</option>
          <option value="crs_ai410">AI410 Machine Learning & Neural Networks</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-[8px]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-[8px]" />
            <Skeleton className="h-64 rounded-[8px]" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Hero Recommendation */}
          <Card
            padding="standard"
            className="border-2 border-accent/40 bg-gradient-to-r from-accent-soft/30 via-white to-accent-soft/10 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-[6px] bg-accent text-white">
                    <Lightbulb className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Top Pedagogical Recommendation
                  </span>
                  <Badge variant="warning">Revision Lab Suggested</Badge>
                </div>
                <h2 className="text-xl font-bold text-ink">
                  Schedule a 30-min Lab on Boyce-Codd Normal Form (BCNF)
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {insights?.teachingSuggestion}
                </p>
              </div>

              <div className="shrink-0">
                {published ? (
                  <Button variant="outline" size="md" disabled>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Announcement Published
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    disabled={publishing}
                    onClick={handlePublishSuggested}
                  >
                    <Send className="w-4 h-4" />
                    {publishing ? 'Publishing...' : 'Publish Suggested Announcement'}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Diagnostic Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frequent Doubts Card */}
            <Card padding="standard" className="border border-mist space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <h3 className="text-base font-bold text-ink">Frequent Student Inquiries</h3>
                </div>
                <span className="text-xs text-slate-400">Past 7 Days</span>
              </div>

              <p className="text-xs text-slate-500">
                Topics generating the highest volume of AI Tutor consultations:
              </p>

              <div className="space-y-3 pt-1">
                {(insights?.frequentDoubts || []).map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-ink">
                      <span>{item.topic}</span>
                      <span className="text-accent">{item.percentage}% ({item.count} questions)</span>
                    </div>
                    <div className="w-full bg-chalk rounded-full h-2 overflow-hidden border border-mist">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Performance Drop Card */}
            <Card padding="standard" className="border border-mist space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  <h3 className="text-base font-bold text-ink">Score Anomaly Detection</h3>
                </div>
                <span className="text-xs text-rose-600 font-semibold">-18% Baseline Drop</span>
              </div>

              <p className="text-xs text-slate-500">
                Assignment rubric criteria showing notable performance friction:
              </p>

              <div className="p-4 rounded-[8px] bg-rose-50/50 border border-rose-200 space-y-2">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                  Critical Criterion Alert
                </span>
                <p className="text-sm font-semibold text-rose-900">
                  {insights?.performanceDropCriteria}
                </p>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Students struggled with multi-valued dependency preservation and minimal cover
                  proofs on Assignment 1.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Recommended Action:</span>
                <span className="font-semibold text-accent flex items-center gap-1">
                  Upload supplementary notes <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
