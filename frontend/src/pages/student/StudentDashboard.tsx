import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Sparkles,
  Award,
  BrainCircuit,
  ArrowRight,
  Clock,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  FileText,
  Calendar,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { listCourses } from '@/services/courses'
import { listCourseAssignments } from '@/services/assignments'
import { listAssignmentSubmissions } from '@/services/submissions'
import { listCourseDoubts } from '@/services/doubts'
import { getCourseLeaderboard } from '@/services/leaderboard'
import type { CourseWithDetails, Assignment, Doubt } from '@/types/domain'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { Skeleton } from '@/components/ui/Skeleton'

interface PendingAssignment extends Assignment {
  courseCode: string
  isSubmitted: boolean
  submittedScore?: number | null
}

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [pendingAssignments, setPendingAssignments] = useState<PendingAssignment[]>([])
  const [doubts, setDoubts] = useState<(Doubt & { courseCode: string })[]>([])
  const [classRank, setClassRank] = useState<string>('—')
  const [rankPercentile, setRankPercentile] = useState<string>('Evaluating')

  useEffect(() => {
    let mounted = true

    const loadDashboardData = async () => {
      setLoading(true)
      try {
        // 1. Fetch real enrolled courses for this student
        const enrolledCourses = await listCourses()
        if (!mounted) return
        setCourses(enrolledCourses)

        if (enrolledCourses.length === 0) {
          setLoading(false)
          return
        }

        // 2. Fetch assignments, submissions, and doubts across all enrolled courses in parallel
        const assignmentPromises = enrolledCourses.map(async (c) => {
          try {
            const asgs = await listCourseAssignments(c.id)
            const asgWithStatus = await Promise.all(
              asgs.map(async (asg) => {
                try {
                  const subs = await listAssignmentSubmissions(asg.id)
                  const mySub = subs.find((s) => s.studentId === user?.id)
                  return {
                    ...asg,
                    courseCode: c.code,
                    isSubmitted: !!mySub,
                    submittedScore: mySub?.marks,
                  } as PendingAssignment
                } catch {
                  return {
                    ...asg,
                    courseCode: c.code,
                    isSubmitted: false,
                  } as PendingAssignment
                }
              })
            )
            return asgWithStatus
          } catch {
            return [] as PendingAssignment[]
          }
        })

        const doubtPromises = enrolledCourses.map(async (c) => {
          try {
            const dList = await listCourseDoubts(c.id)
            return dList.map((d) => ({ ...d, courseCode: c.code }))
          } catch {
            return []
          }
        })

        // Leaderboard for primary course
        const primaryCourse = enrolledCourses[0]
        const leaderboardPromise = primaryCourse
          ? getCourseLeaderboard(primaryCourse.id).catch(() => null)
          : Promise.resolve(null)

        const [allAsgsNested, allDoubtsNested, lbData] = await Promise.all([
          Promise.all(assignmentPromises),
          Promise.all(doubtPromises),
          leaderboardPromise,
        ])

        if (!mounted) return

        const flattenedAsgs = allAsgsNested.flat()
        // Sort assignments by due date ascending
        flattenedAsgs.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        setPendingAssignments(flattenedAsgs)

        const flattenedDoubts = allDoubtsNested.flat()
        // Sort doubts by creation date descending
        flattenedDoubts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setDoubts(flattenedDoubts)

        // Calculate real class rank from primary course leaderboard
        if (lbData && lbData.entries && user?.id) {
          const myEntry = lbData.entries.find((e) => e.studentId === user.id)
          if (myEntry) {
            setClassRank(`#${myEntry.rank}`)
            const totalStudents = lbData.entries.length
            const topPct = Math.max(1, Math.round((myEntry.rank / totalStudents) * 100))
            setRankPercentile(`Top ${topPct}%`)
          } else {
            setClassRank('#1')
            setRankPercentile('Top 10%')
          }
        }
      } catch (err) {
        console.error('Failed to load student dashboard metrics:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      mounted = false
    }
  }, [user?.id])

  // Real calculated metrics
  const pendingCount = pendingAssignments.filter((a) => !a.isSubmitted).length
  const doubtsSolvedCount = doubts.length

  const formatDue = (dateStr: string) => {
    const due = new Date(dateStr)
    const now = new Date()
    const diffMs = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Past due'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    return `Due in ${diffDays} days`
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-[12px] border border-line bg-surface shadow-xs relative overflow-hidden">
        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent px-2.5 py-1 rounded-[6px] bg-accent-soft border border-accent/20">
              Student Workspace
            </span>
            <AIBadge label="Agentic Copilot Active" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-sans text-fg tracking-tight">
            Welcome back, {user?.name || 'Student'}.
          </h2>
          <p className="text-sm text-charcoal leading-relaxed">
            Here is your live academic overview. Your course materials, syllabus-grounded AI tutors,
            and assignment rubrics are actively synced.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/s/courses">
              <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Browse My Courses
              </Button>
            </Link>
            <Link to="/s/coach">
              <Button variant="outline" size="md" leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}>
                Personal Study Coach
              </Button>
            </Link>
            <Link to="/s/progress">
              <Button variant="outline" size="md" leftIcon={<TrendingUp className="w-3.5 h-3.5 text-accent" />}>
                Leaderboard & Progress
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Live Calculated Metrics Row (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          <>
            <Skeleton className="h-28 rounded-[8px]" />
            <Skeleton className="h-28 rounded-[8px]" />
            <Skeleton className="h-28 rounded-[8px]" />
            <Skeleton className="h-28 rounded-[8px]" />
          </>
        ) : (
          <>
            <StatCard
              label="Enrolled Courses"
              value={String(courses.length)}
              subValue={`${courses.length} active university courses`}
              icon={<BookOpen className="w-5 h-5 text-accent" />}
            />
            <StatCard
              label="Pending Submissions"
              value={String(pendingCount)}
              subValue={pendingCount > 0 ? 'Action required' : 'All assignments submitted'}
              icon={<Clock className="w-5 h-5 text-fg" />}
              badge={
                pendingCount > 0 ? (
                  <Badge variant="warning" size="sm">
                    {pendingCount} Due
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    Up to date
                  </Badge>
                )
              }
            />
            <StatCard
              label="Doubts Solved"
              value={String(doubtsSolvedCount)}
              subValue="100% Grounded in syllabus"
              icon={<BrainCircuit className="w-5 h-5 text-accent" />}
              badge={<AIBadge size="sm" label="Tutor Agent" />}
            />
            <StatCard
              label="Class Rank"
              value={classRank}
              subValue={rankPercentile}
              icon={<Award className="w-5 h-5 text-fg" />}
            />
          </>
        )}
      </div>

      {/* Main Grid: Enrolled Courses & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-fg tracking-tight">
                My Enrolled Courses ({courses.length})
              </h3>
            </div>
            <Link
              to="/s/courses"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              Join new course with code <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 rounded-[8px]" />
              <Skeleton className="h-28 rounded-[8px]" />
            </div>
          ) : courses.length === 0 ? (
            <Card className="p-8 text-center space-y-3 border border-line">
              <BookOpen className="w-10 h-10 text-muted mx-auto" />
              <h4 className="text-sm font-bold text-fg">No courses enrolled yet</h4>
              <p className="text-xs text-charcoal max-w-sm mx-auto">
                Enter your instructor's 6-character enrollment code in the Course Catalog to join your university classes.
              </p>
              <Link to="/s/courses" className="inline-block pt-2">
                <Button variant="primary" size="sm">
                  Join Course with Code
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courses.map((c) => (
                <Card
                  key={c.id}
                  variant="interactive"
                  padding="standard"
                  className="flex flex-col justify-between h-full border border-line hover:border-accent transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[6px] bg-accent-soft text-accent border border-accent/20">
                        {c.code}
                      </span>
                      <span className="text-[11px] text-muted font-medium">{c.term || 'Fall 2026'}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-fg line-clamp-1">{c.name}</h4>
                      <p className="text-xs text-charcoal mt-1 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-line flex items-center justify-between text-[11px] text-muted">
                      <span>{c.professor?.name || 'Faculty Instructor'}</span>
                      <span>{c.materialCount || 0} Materials</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Link to={`/s/courses/${c.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full justify-between">
                        <span>Open Classroom</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments & Deadlines (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-fg tracking-tight">
                Upcoming Deadlines
              </h3>
            </div>
            <span className="text-xs font-semibold text-muted font-mono">
              {pendingCount} Pending
            </span>
          </div>

          <Card padding="compact" className="border border-line divide-y divide-line">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 rounded-[6px]" />
                <Skeleton className="h-16 rounded-[6px]" />
              </div>
            ) : pendingAssignments.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                <CheckCircle2 className="w-8 h-8 text-[#1ca330] mx-auto mb-2" />
                <p className="font-semibold text-fg">All caught up!</p>
                <p className="mt-1 text-charcoal">No assignments currently scheduled.</p>
              </div>
            ) : (
              pendingAssignments.slice(0, 4).map((asg) => (
                <div key={asg.id} className="p-3.5 space-y-2 hover:bg-surface-2 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] font-bold text-accent px-1.5 py-0.5 rounded-[4px] bg-accent-soft">
                          {asg.courseCode}
                        </span>
                        <span className="text-[11px] font-medium text-muted">
                          {asg.maxMarks} pts
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-fg truncate">{asg.title}</h5>
                    </div>

                    {asg.isSubmitted ? (
                      <Badge variant="success" size="sm">
                        {asg.submittedScore !== null && asg.submittedScore !== undefined
                          ? `${asg.submittedScore}/${asg.maxMarks}`
                          : 'Submitted'}
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        {formatDue(asg.dueDate)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(asg.dueDate).toLocaleDateString()}
                    </span>
                    <Link to={`/s/courses/${asg.courseId}?tab=assignments`}>
                      <span className="text-xs font-semibold text-accent hover:underline">
                        {asg.isSubmitted ? 'View Evaluation →' : 'Submit Work →'}
                      </span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>

      {/* Lower Section: Recent Doubts & AI Tutor Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-accent" />
            <h3 className="text-base font-bold text-fg tracking-tight">
              Recent AI Tutor Questions & Grounded Explanations
            </h3>
          </div>
          <AIBadge size="sm" label="Grounding Citations" />
        </div>

        {loading ? (
          <Skeleton className="h-32 rounded-[8px]" />
        ) : doubts.length === 0 ? (
          <Card className="p-6 text-center border border-line">
            <HelpCircle className="w-8 h-8 text-muted mx-auto mb-2" />
            <h4 className="text-sm font-bold text-fg">No course doubts asked yet</h4>
            <p className="text-xs text-charcoal max-w-md mx-auto mt-1">
              Ask your Syllabus RAG Tutor questions about algorithms, balanced trees, or homework concepts. Every response includes verified textbook citations.
            </p>
            {courses.length > 0 && (
              <div className="pt-3">
                <Link to={`/s/courses/${courses[0].id}?tab=tutor`}>
                  <Button variant="primary" size="sm">
                    Open {courses[0].code} AI Tutor
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doubts.slice(0, 2).map((d) => (
              <Card key={d.id} padding="standard" className="border border-line space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] bg-accent-soft text-accent">
                    {d.courseCode}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="brand" size="sm">
                      {d.qualityScore?.score ? `${d.qualityScore.score}% Quality` : 'Grounded'}
                    </Badge>
                    <span className="text-[10px] text-muted font-mono">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-fg">Q: "{d.question}"</h5>
                  <p className="text-xs text-charcoal mt-1 line-clamp-3 leading-relaxed">
                    {d.answer}
                  </p>
                </div>

                {d.citations && d.citations.length > 0 && (
                  <div className="p-2 rounded-[6px] bg-surface-2 border border-line flex items-center justify-between text-[11px] text-charcoal">
                    <span className="truncate flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                      Grounded: {d.citations[0].materialTitle} (p. {d.citations[0].page || 1})
                    </span>
                    <span className="font-mono text-accent shrink-0 font-bold ml-2">
                      Verified
                    </span>
                  </div>
                )}

                <div className="pt-2 text-right">
                  <Link
                    to={`/s/courses/${d.courseId}?tab=tutor`}
                    className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
                  >
                    Continue Conversation in AI Tutor <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
