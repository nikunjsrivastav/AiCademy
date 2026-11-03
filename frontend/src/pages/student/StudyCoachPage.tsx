/**
 * Proactive Study Coach page from /docs/AGENTIC_DESIGN.md B1.7 and Decision D16.
 * Analyzes deadlines and weak topics, synthesizes a 3-step mastery sprint,
 * and provides "Add to Calendar" with native .ics calendar export.
 */
import React, { useState, useEffect } from 'react'
import { getStudyPlan } from '@/services/agents'
import { listCourses } from '@/services/courses'
import type { Course } from '@/types/domain'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import {
  Compass,
  Calendar,
  Clock,
  BookOpen,
  ListOrdered,
} from 'lucide-react'

export const StudyCoachPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState<string>('')
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const { showToast } = useToast()

  // 1. Fetch real enrolled courses
  useEffect(() => {
    let mounted = true
    const loadCourses = async () => {
      setCoursesLoading(true)
      try {
        const enrolled = await listCourses()
        if (mounted) {
          setCourses(enrolled)
          if (enrolled.length > 0) {
            setCourseId(enrolled[0].id)
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

  // 2. Fetch study plan for selected course
  useEffect(() => {
    if (!courseId) {
      setPlan(null)
      setLoading(false)
      return
    }

    let mounted = true
    const fetchPlan = async () => {
      setLoading(true)
      try {
        const data = await getStudyPlan(courseId)
        if (mounted) setPlan(data)
      } catch {
        if (mounted) setPlan(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchPlan()
    return () => {
      mounted = false
    }
  }, [courseId])

  // Decision D16: Add to Calendar & .ics file download
  const handleExportICS = () => {
    if (!plan) return
    const calendarEvent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AiCademy//Study Coach Sprint//EN',
      'BEGIN:VEVENT',
      `SUMMARY:AiCademy Mastery Sprint: ${plan?.title || 'Course Mastery'}`,
      `DESCRIPTION:${(plan?.steps || []).map((s: any) => `${s.step}. ${s.title}`).join('\\n')}`,
      'DTSTART:20261102T150000Z',
      'DTEND:20261102T163000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([calendarEvent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'AiCademy_Study_Sprint.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showToast('AiCademy_Study_Sprint.ics downloaded. Added to your calendar.', 'success')
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
          <h1 className="text-2xl font-bold text-fg">Personalized Study Coach</h1>
          <p className="text-sm text-muted">
            Autonomous study plans tailored to upcoming assignment deadlines and concept mastery gaps.
          </p>
        </div>
        <Card padding="standard" className="border border-line bg-surface">
          <EmptyState
            icon={<Compass className="w-10 h-10 text-accent" />}
            title="No Enrolled Courses Found"
            description="You are not enrolled in any courses yet. Join a course using an enrollment code from your professor to unlock adaptive AI study plans."
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
            <h1 className="text-2xl font-bold text-fg">Personalized Study Coach</h1>
            <AIBadge label="Proactive AI Guidance" />
          </div>
          <p className="text-sm text-muted">
            Autonomous study plans tailored to upcoming assignment deadlines and concept mastery gaps.
          </p>
        </div>

        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="text-xs bg-surface-2 border border-line rounded-[6px] px-3 py-2 text-fg font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
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
          <Skeleton className="h-40 w-full rounded-[8px]" />
          <Skeleton className="h-28 w-full rounded-[8px]" />
          <Skeleton className="h-28 w-full rounded-[8px]" />
        </div>
      ) : !plan || !plan.steps || plan.steps.length === 0 ? (
        <Card padding="standard" className="border border-mist">
          <EmptyState
            icon={<BookOpen className="w-8 h-8 text-accent" />}
            title="No Active Study Sprint"
            description="As your professor uploads syllabus materials and creates assignments, your AI Study Coach will generate targeted review sprints."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Hero Mastery Sprint Card */}
          <Card
            padding="standard"
            className="border-2 border-accent/40 bg-gradient-to-r from-accent-soft/30 via-white to-accent-soft/10 relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-[6px] bg-accent text-white">
                    <Compass className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Active Mastery Sprint
                  </span>
                  {plan.deadline && <Badge variant="warning">{plan.deadline}</Badge>}
                </div>
                <h2 className="text-xl font-bold text-ink">{plan.title}</h2>
                {plan.weakTopics && plan.weakTopics.length > 0 && (
                  <p className="text-sm text-slate-600">
                    Targeted review focused on weak topics identified from diagnostic traces:{' '}
                    <span className="font-semibold text-accent">
                      {plan.weakTopics.join(', ')}
                    </span>
                    .
                  </p>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Button variant="primary" size="md" onClick={handleExportICS}>
                  <Calendar className="w-4 h-4" />
                  Add to Calendar (.ics)
                </Button>
              </div>
            </div>
          </Card>

          {/* Actionable Sprint Steps */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-accent" />
              Actionable 3-Step Study Plan
            </h3>

            {plan.steps.map((step: any, idx: number) => (
              <Card key={idx} padding="standard" className="border border-mist hover:border-accent/40 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-[6px] bg-accent-soft text-accent text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.step || idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-ink">{step.title}</h4>
                      {step.duration && (
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          Estimated Time: {step.duration}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Recommended Materials Quick Links */}
          {plan.recommendedMaterials && plan.recommendedMaterials.length > 0 && (
            <Card padding="standard" className="border border-mist space-y-3">
              <h4 className="text-sm font-bold text-ink flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                Direct Lecture Slide Citations for this Sprint
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plan.recommendedMaterials.map((mat: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-[6px] bg-chalk border border-mist flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="font-medium text-ink truncate">{mat.title}</span>
                    {mat.pages && <Badge variant="brand">Slides {mat.pages.join(', ')}</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
