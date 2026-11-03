/**
 * EXTENSION: Proactive Study Coach page from /docs/AGENTIC_DESIGN.md B1.7 and Decision D16.
 * Analyzes deadlines and weak topics, synthesizes a 3-step mastery sprint,
 * and provides "Add to Calendar" with native .ics calendar export.
 */
import React, { useState, useEffect } from 'react'
import { getStudyPlan } from '@/services/agents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  Compass,
  Calendar,
  Clock,
  BookOpen,
  ListOrdered,
} from 'lucide-react'

export const StudyCoachPage: React.FC = () => {
  const [courseId, setCourseId] = useState('crs_cs301')
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const data = await getStudyPlan(courseId)
      setPlan(data)
    } catch {
      showToast('Failed to load study plan.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlan()
  }, [courseId])

  // Decision D16: Add to Calendar & .ics file download
  const handleExportICS = () => {
    const calendarEvent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AiCademy//Study Coach Sprint//EN',
      'BEGIN:VEVENT',
      `SUMMARY:AiCademy Mastery Sprint: ${plan?.title || 'Database Systems'}`,
      `DESCRIPTION:${plan?.steps?.map((s: any) => `${s.step}. ${s.title}`).join('\\n')}`,
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

    showToast('AiCademy_Study_Sprint.ics downloaded. Added to your calendar (D16).', 'success')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">Personalized Study Coach</h1>
            <ExtensionTag label="Study Coach Agent" />
            <AIBadge label="Proactive AI Guidance" />
          </div>
          <p className="text-sm text-slate-500">
            Autonomous study plans tailored to upcoming assignment deadlines and concept mastery gaps.
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
          <Skeleton className="h-40 w-full rounded-[8px]" />
          <Skeleton className="h-28 w-full rounded-[8px]" />
          <Skeleton className="h-28 w-full rounded-[8px]" />
        </div>
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
                  <Badge variant="warning">Assignment Due in 5 Days</Badge>
                </div>
                <h2 className="text-xl font-bold text-ink">{plan?.title}</h2>
                <p className="text-sm text-slate-600">
                  Targeted review focused on weak topics identified from diagnostic traces:{' '}
                  <span className="font-semibold text-accent">
                    {(plan?.weakTopics || []).join(', ')}
                  </span>
                  .
                </p>
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

            {(plan?.steps || []).map((step: any, idx: number) => (
              <Card key={idx} padding="standard" className="border border-mist hover:border-accent/40 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-[6px] bg-accent-soft text-accent text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.step}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-ink">{step.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Estimated Time: {step.duration}
                      </p>
                    </div>
                  </div>

                  <span className="p-2 rounded-[6px] bg-chalk border border-mist text-slate-500 hover:text-accent hover:border-accent text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors">
                    <BookOpen className="w-3.5 h-3.5" />
                    Open Material
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {/* Recommended Materials Quick Links */}
          <Card padding="standard" className="border border-mist space-y-3">
            <h4 className="text-sm font-bold text-ink flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              Direct Lecture Slide Citations for this Sprint
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(plan?.recommendedMaterials || []).map((mat: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-[6px] bg-chalk border border-mist flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-medium text-ink truncate">{mat.title}</span>
                  <Badge variant="brand">Slides {mat.pages?.join(', ')}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
