/**
 * EXTENSION: Teaching Insights Copilot page from /docs/AGENTIC_DESIGN.md B1.6.
 * Synthesizes student question clusters and score drops into curriculum recommendations,
 * with 1-click announcement publishing.
 */
import React, { useState, useEffect } from 'react'
import { getCourseInsights } from '@/services/agents'
import { listCourses } from '@/services/courses'
import { createAnnouncement } from '@/services/announcements'
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
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'

export const InsightsCopilot: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState<string>('')
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
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

  const fetchInsights = async () => {
    if (!courseId) {
      setInsights(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setPublished(false)
    try {
      const data = await getCourseInsights(courseId)
      setInsights(data)
    } catch {
      setInsights(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInsights()
  }, [courseId])

  const handlePublishSuggested = async () => {
    if (!insights || !courseId) return
    setPublishing(true)
    try {
      await createAnnouncement({
        courseId,
        title: `Curriculum Review: ${insights.title || 'Core Topic Clarification'}`,
        content:
          insights.suggestedAnnouncement ||
          'Based on recent student inquiries, we will hold an interactive review session this week. Bring your questions!',
      })
      setPublished(true)
      showToast('Announcement published directly to course stream (D7).', 'success')
    } catch {
      showToast('Failed to publish announcement.', 'error')
    } finally {
      setPublishing(false)
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
          <h1 className="text-2xl font-bold text-ink">Teaching Insights Copilot</h1>
          <p className="text-sm text-slate-500">
            Autonomous curriculum analysis synthesizing student doubts, submission score patterns, and weak concepts.
          </p>
        </div>
        <Card padding="standard" className="border border-mist">
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-accent" />}
            title="No Courses Found"
            description="Create a course first in Course Studio to start gathering student insights and question analytics."
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
            <h1 className="text-2xl font-bold text-ink">Teaching Insights Copilot</h1>
            <ExtensionTag label="Insights Agent" />
            <AIBadge label="Autonomous Curriculum Coach" />
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
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}: {c.name}
            </option>
          ))}
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
      ) : !insights ? (
        <Card padding="standard" className="border border-mist">
          <EmptyState
            icon={<Lightbulb className="w-8 h-8 text-accent" />}
            title="No Insights Available Yet"
            description="As students submit assignments and ask doubts to the AI Tutor, curriculum trends and review recommendations will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Top Friction Alert */}
          <Card
            padding="standard"
            className="border-2 border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-[8px] bg-amber-500 text-white shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-ink">
                    Primary Friction Identified: {insights.weakTopic}
                  </h3>
                  <Badge variant="warning">{insights.dropPercentage}% Score Drop</Badge>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {insights.observation}
                </p>
              </div>
            </div>
          </Card>

          {/* 2-Column Split: Questions Clustered + Suggested Action */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clustered Student Inquiries */}
            <Card padding="standard" className="border border-mist space-y-4">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                Frequent Student Doubts ({insights.frequentDoubts?.length || 0})
              </h4>
              <div className="space-y-2.5">
                {(insights.frequentDoubts || []).map((doubt: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[6px] bg-chalk border border-mist space-y-1 text-xs"
                  >
                    <p className="font-semibold text-ink">"{doubt.question}"</p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      Asked by {doubt.count} students &bull; Avg quality: {doubt.qualityScore}/100
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 1-Click Announcement Draft */}
            <Card padding="standard" className="border border-mist space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                    <Send className="w-4 h-4 text-accent" />
                    Agent-Drafted Revision Announcement
                  </h4>
                  <Badge variant="brand">Ready to Post</Badge>
                </div>

                <div className="p-3.5 rounded-[8px] bg-accent-soft/30 border border-accent/20 text-xs text-ink leading-relaxed space-y-2">
                  <p className="font-bold">
                    Title: Revision Lab: {insights.weakTopic}
                  </p>
                  <p className="text-slate-600">
                    {insights.suggestedAnnouncement}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-mist flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono">
                  Publishes to course feed
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={publishing || published}
                  onClick={handlePublishSuggested}
                >
                  {published ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      Published to Course!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {publishing ? 'Publishing...' : '1-Click Publish to Class'}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
