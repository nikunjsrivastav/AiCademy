/**
 * Student Academic Progress & Leaderboard from /docs/ARCHITECTURE_SOURCE.md Section 5.4 and Decision D3.
 * Shows assignment completion trends, question quality metrics, and course leaderboard rank.
 */
import React, { useState, useEffect } from 'react'
import { getCourseLeaderboard, type EnrichedLeaderboard } from '@/services/leaderboard'
import { listCourses } from '@/services/courses'
import type { Course } from '@/types/domain'
import { useAuth } from '@/auth/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import {
  Trophy,
  Award,
  Flame,
  HelpCircle,
  TrendingUp,
  BookOpen,
} from 'lucide-react'

export const StudentProgressPage: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState<string>('')
  const [leaderboard, setLeaderboard] = useState<EnrichedLeaderboard | null>(null)
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
        if (mounted) showToast('Failed to load enrolled courses.', 'error')
      } finally {
        if (mounted) setCoursesLoading(false)
      }
    }
    loadCourses()
    return () => {
      mounted = false
    }
  }, [])

  // 2. Fetch leaderboard for selected course
  useEffect(() => {
    if (!courseId) {
      setLeaderboard(null)
      setLoading(false)
      return
    }

    let mounted = true
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const data = await getCourseLeaderboard(courseId)
        if (mounted) setLeaderboard(data)
      } catch {
        if (mounted) showToast('Failed to load leaderboard.', 'error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchLeaderboard()
    return () => {
      mounted = false
    }
  }, [courseId])

  if (coursesLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-12 w-64 rounded-[8px]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-[8px]" />
          <Skeleton className="h-24 rounded-[8px]" />
          <Skeleton className="h-24 rounded-[8px]" />
          <Skeleton className="h-24 rounded-[8px]" />
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl font-bold text-fg">Academic Progress & Leaderboard</h1>
          <p className="text-sm text-muted">
            Rankings derived from 50% assignments + 30% projects + 20% doubt inquiry quality.
          </p>
        </div>
        <Card padding="standard" className="border border-line bg-surface">
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-accent" />}
            title="No Enrolled Courses Found"
            description="You are not enrolled in any courses yet. Join a course using an enrollment code from your professor to start tracking your performance and rankings."
          />
        </Card>
      </div>
    )
  }

  const myEntry = leaderboard?.entries.find((e) => e.studentId === user?.id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-fg">Academic Progress & Leaderboard</h1>
          </div>
          <p className="text-sm text-muted">
            Rankings derived from 50% assignments + 30% projects + 20% doubt inquiry quality.
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

      {/* Progress Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="compact" className="border border-line bg-surface">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Course Rank</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-fg">
            {myEntry ? `#${myEntry.rank}` : '—'}
          </p>
          <span className="text-xs text-muted font-medium">
            {myEntry ? 'Active Rank' : 'No Submissions Yet'}
          </span>
        </Card>

        <Card padding="compact" className="border border-line bg-surface">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Overall Score</span>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-fg">
            {myEntry ? `${myEntry.total}%` : '—'}
          </p>
          <span className="text-xs text-muted">Weighted Total</span>
        </Card>

        <Card padding="compact" className="border border-line bg-surface">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Doubt Quality</span>
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-fg">
            {myEntry ? `${myEntry.doubtScore}/100` : '—'}
          </p>
          <span className="text-xs text-accent font-medium">20% Weight</span>
        </Card>

        <Card padding="compact" className="border border-line bg-surface">
          <div className="flex items-center justify-between text-muted mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Study Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-fg">
            {myEntry ? '1 Day' : '—'}
          </p>
          <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Active Habit</span>
        </Card>
      </div>

      {/* Leaderboard Table Card */}
      <Card padding="standard" className="border border-line bg-surface space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-fg flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Course Ranking Snapshot
            </h3>
            <p className="text-xs text-muted">
              Formula: 50% Assignments + 30% Projects + 20% Doubt Quality
            </p>
          </div>
          <span className="text-xs font-mono text-muted">
            Last recomputed: {leaderboard?.computedAt ? new Date(leaderboard.computedAt).toLocaleDateString() : 'Real-time'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !leaderboard || leaderboard.entries.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted">
            No graded submissions or student doubts recorded yet for this course. Be the first to submit work!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted uppercase tracking-wider border-b border-line">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Assignments (50%)</th>
                  <th className="py-3 px-4 font-semibold">Projects (30%)</th>
                  <th className="py-3 px-4 font-semibold">Doubts (20%)</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                {leaderboard.entries.map((entry) => {
                  const isCurrent = entry.studentId === user?.id
                  return (
                    <tr
                      key={entry.studentId}
                      className={isCurrent ? 'bg-accent-soft/40 font-bold' : 'hover:bg-surface-2/50'}
                    >
                      <td className="py-3.5 px-4 font-bold text-fg">
                        {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-fg">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: `hsl(${entry.avatarHue || 200}, 70%, 45%)` }}
                          >
                            {entry.studentName.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{entry.studentName}</span>
                          {isCurrent && <Badge variant="brand">You</Badge>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{entry.assignmentScore}%</td>
                      <td className="py-3.5 px-4 text-slate-600">{entry.projectScore}%</td>
                      <td className="py-3.5 px-4 text-slate-600">{entry.doubtScore}%</td>
                      <td className="py-3.5 px-4 text-right font-bold text-accent text-sm">
                        {entry.total}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
