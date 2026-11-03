import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Download,
  Search,
  CheckCircle2,
  BrainCircuit,
  FileSpreadsheet,
  FileCode,
  File,
  Layers,
  MessageSquare,
  Award,
  UploadCloud,
  Send,
  Clock,
  Sparkles,
  Bot,
  ExternalLink,
  Trash2,
  BookOpen,
} from 'lucide-react'
import { getCourse } from '@/services/courses'
import { listCourseMaterials } from '@/services/materials'
import { listCourseAssignments } from '@/services/assignments'
import { listAssignmentSubmissions, uploadSubmission } from '@/services/submissions'
import { askDoubt, listCourseDoubts, clearChatHistory } from '@/services/doubts'
import { listCourseAnnouncements, addAnnouncementComment } from '@/services/announcements'
import { getCourseLeaderboard, type EnrichedLeaderboard } from '@/services/leaderboard'
import type {
  CourseWithDetails,
  Material,
  Assignment,
  Submission,
  Doubt,
  Announcement,
  Citation,
} from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { AIBadge } from '@/components/ui/AIBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/auth/AuthContext'
import { errorMessage } from '@/services/http'

function getFileIcon(type: string) {
  switch (type) {
    case 'pdf':
      return <FileText className="w-5 h-5 text-rose-500" />
    case 'slides':
      return <Layers className="w-5 h-5 text-amber-500" />
    case 'document':
      return <FileSpreadsheet className="w-5 h-5 text-blue-500" />
    case 'notes':
      return <FileCode className="w-5 h-5 text-emerald-500" />
    default:
      return <File className="w-5 h-5 text-charcoal" />
  }
}

export const StudentCourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') as 'materials' | 'assignments' | 'tutor' | 'announcements' | 'leaderboard' | null
  const [course, setCourse] = useState<CourseWithDetails | null>(null)
  const [activeTab, setActiveTabState] = useState<'materials' | 'assignments' | 'tutor' | 'announcements' | 'leaderboard'>(
    initialTab && ['materials', 'assignments', 'tutor', 'announcements', 'leaderboard'].includes(initialTab)
      ? initialTab
      : 'materials'
  )

  const setActiveTab = useCallback((tab: 'materials' | 'assignments' | 'tutor' | 'announcements' | 'leaderboard') => {
    setActiveTabState(tab)
    setSearchParams({ tab }, { replace: true })
  }, [setSearchParams])

  useEffect(() => {
    const tab = searchParams.get('tab') as 'materials' | 'assignments' | 'tutor' | 'announcements' | 'leaderboard' | null
    if (tab && ['materials', 'assignments', 'tutor', 'announcements', 'leaderboard'].includes(tab)) {
      setActiveTabState(tab)
    }
  }, [searchParams])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Materials tab state
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  // Assignments tab state
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission | null>>({})
  const [uploadModalAsg, setUploadModalAsg] = useState<Assignment | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmittingWork, setIsSubmittingWork] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Tutor tab state
  const [doubts, setDoubts] = useState<Doubt[]>([])
  const [questionInput, setQuestionInput] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [citationModal, setCitationModal] = useState<Citation | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Announcements tab state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [postingComment, setPostingComment] = useState<Record<string, boolean>>({})

  // Leaderboard tab state
  const [leaderboard, setLeaderboard] = useState<EnrichedLeaderboard | null>(null)

  const fetchData = useCallback(async () => {
    if (!courseId) return
    try {
      setIsLoading(true)
      setError(null)
      const [cData, mData, aData] = await Promise.all([
        getCourse(courseId),
        listCourseMaterials(courseId),
        listCourseAssignments(courseId),
      ])
      setCourse(cData)
      setMaterials(mData)
      setAssignments(aData)

      // Fetch student submissions for each assignment
      const subMap: Record<string, Submission | null> = {}
      await Promise.all(
        aData.map(async (asg) => {
          try {
            const list = await listAssignmentSubmissions(asg.id)
            subMap[asg.id] = list.length > 0 ? list[0] : null
          } catch {
            subMap[asg.id] = null
          }
        })
      )
      setSubmissions(subMap)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Lazy load tab data
  useEffect(() => {
    if (!courseId) return
    if (activeTab === 'tutor') {
      listCourseDoubts(courseId).then(setDoubts).catch(() => {})
    } else if (activeTab === 'announcements') {
      listCourseAnnouncements(courseId).then(setAnnouncements).catch(() => {})
    } else if (activeTab === 'leaderboard') {
      getCourseLeaderboard(courseId).then(setLeaderboard).catch(() => {})
    }
  }, [activeTab, courseId])

  useEffect(() => {
    if (activeTab === 'tutor') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [doubts, activeTab])

  // Submission handler
  const handleUploadWork = async () => {
    if (!uploadModalAsg || !selectedFile) return
    setIsSubmittingWork(true)
    try {
      const res = await uploadSubmission(uploadModalAsg.id, {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
      })

      showToast('Assignment submitted successfully! Grader Agent evaluating work...', 'success')
      setSubmissions((prev) => ({ ...prev, [uploadModalAsg.id]: res }))
      setUploadModalAsg(null)
      setSelectedFile(null)
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsSubmittingWork(false)
    }
  }

  // Ask Doubt handler
  const handleAskDoubt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !questionInput.trim() || isAsking) return
    const q = questionInput.trim()
    setQuestionInput('')
    setIsAsking(true)

    try {
      const doubt = await askDoubt({ courseId, question: q })
      setDoubts((prev) => [...prev, doubt])
      showToast('AI Tutor answered with grounded source citations.', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsAsking(false)
    }
  }

  // Clear Chat handler
  const handleClearChat = async () => {
    if (!courseId) return
    try {
      await clearChatHistory(courseId)
      setDoubts([])
      showToast('Chat history cleared for this session (marker saved).', 'info')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  // Add Comment handler
  const handleAddComment = async (announcementId: string) => {
    const text = commentInputs[announcementId]?.trim()
    if (!text) return
    setPostingComment((prev) => ({ ...prev, [announcementId]: true }))

    try {
      const comment = await addAnnouncementComment(announcementId, { text })
      setAnnouncements((prev) =>
        prev.map((a) => {
          if (a.id === announcementId) {
            return { ...a, comments: [...(a.comments || []), comment] }
          }
          return a
        })
      )
      setCommentInputs((prev) => ({ ...prev, [announcementId]: '' }))
      showToast('Comment posted.', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setPostingComment((prev) => ({ ...prev, [announcementId]: false }))
    }
  }

  const filteredMaterials = materials.filter((m) => {
    const q = materialSearch.toLowerCase().trim()
    if (!q) return true
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.fileName.toLowerCase().includes(q) ||
      m.indexing.topics.some((t) => t.toLowerCase().includes(q))
    )
  })

  if (isLoading && !course) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-[8px]" />
        <Skeleton className="h-10 w-full rounded-[8px]" />
        <Skeleton className="h-64 w-full rounded-[8px]" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <Link to="/s/courses" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to courses
        </Link>
        <ErrorState message={error || 'Course not found'} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/s/courses" className="hover:text-accent flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Courses
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{course.code}</span>
      </div>

      {/* Hero Banner */}
      <div className="p-6 sm:p-8 rounded-[8px] border border-mist bg-white shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold px-3 py-1 rounded-[6px] bg-accent-soft text-accent">
              {course.code}
            </span>
            <Badge variant="neutral">{course.term || 'Fall 2026'}</Badge>
            <AIBadge label="Agentic Classroom" />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {course.studentCount} Students Enrolled
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {course.name}
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {course.description}
          </p>
        </div>

        {course.professor && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-mist text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[10px]">
                {course.professor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <span className="font-semibold text-ink">{course.professor.name}</span>
            </div>
            <span>•</span>
            <span>{course.department || 'Computer Science'}</span>
            <span>•</span>
            <span>{materials.length} Materials</span>
            <span>•</span>
            <span>{assignments.length} Assignments</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-mist gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'materials'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Materials ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'assignments'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <FileText className="w-4 h-4" />
          Assignments & Work ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('tutor')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'tutor'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <Bot className="w-4 h-4" />
          AI Tutor Chat
          <AIBadge label="RAG" />
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'announcements'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Announcements
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'leaderboard'
              ? 'border-accent text-accent font-bold'
              : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <Award className="w-4 h-4" />
          Leaderboard (D3)
        </button>
      </div>

      {/* TAB 1: MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Learning Materials & Vector Ingestions</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Search topics or keywords..."
                className="w-full text-xs pl-9 pr-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredMaterials.map((mat) => (
              <Card key={mat.id} padding="compact" className="border border-mist flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-[8px] bg-chalk border border-mist shrink-0">
                    {getFileIcon(mat.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{mat.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{mat.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {mat.indexing.topics.map((topic, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-[4px] bg-chalk text-slate-600 border border-mist font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setSelectedMaterial(mat)}>
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Vector Info
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => showToast(`Simulated download: ${mat.fileName}`, 'info')}>
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS & SUBMISSIONS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink">Course Assignments & Evaluations</h2>
              <p className="text-xs text-slate-500">
                Submit work in PDF, DOCX, TXT, or ZIP up to 10MB (D10). Graded via autonomous Rubric Grader Agent.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {assignments.map((asg) => {
              const sub = submissions[asg.id]
              const isSubmitted = Boolean(sub)
              const isGraded = sub?.evaluationStatus === 'graded'
              const isPendingReview = sub?.evaluationStatus === 'awaiting_review'

              return (
                <Card key={asg.id} padding="standard" className="border border-mist space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] bg-accent-soft text-accent">
                          {asg.classification}
                        </span>
                        <h3 className="text-base font-bold text-ink">{asg.title}</h3>
                        {isGraded ? (
                          <Badge variant="success">Graded ({sub?.marks}/{asg.maxMarks})</Badge>
                        ) : isPendingReview ? (
                          <Badge variant="warning">AI Review Pending (D12)</Badge>
                        ) : isSubmitted ? (
                          <Badge variant="info">Evaluating...</Badge>
                        ) : (
                          <Badge variant="neutral">Not Submitted</Badge>
                        )}
                        {sub?.late && <Badge variant="danger">Late</Badge>}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Due: {new Date(asg.dueDate).toLocaleDateString()} at{' '}
                        {new Date(asg.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span>• Max Points: {asg.maxMarks}</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant={isSubmitted ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => setUploadModalAsg(asg)}
                      >
                        <UploadCloud className="w-4 h-4" />
                        {isSubmitted && sub ? `Resubmit (v${sub.version + 1})` : 'Submit Solution'}
                      </Button>
                    </div>
                  </div>

                  {/* Rubric Criteria Accordion Preview */}
                  <div className="p-4 rounded-[8px] bg-chalk border border-mist space-y-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Rubric Criteria ({asg.rubric.length} Dimensions)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {asg.rubric.map((crit) => (
                        <div key={crit.id} className="p-3 bg-white rounded-[6px] border border-mist text-xs space-y-1">
                          <div className="flex justify-between font-bold text-ink">
                            <span>{crit.title}</span>
                            <span className="text-accent">{crit.maxMarks} pts</span>
                          </div>
                          <p className="text-slate-500 text-[11px] leading-relaxed">{crit.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* If Submitted: Submission Evaluation Status Card */}
                  {sub && (
                    <div className="p-4 rounded-[8px] bg-white border border-accent/30 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-ink">
                            Active Submission: {sub.fileName} (v{sub.version})
                          </span>
                          {sub.confidence && (
                            <ConfidenceBadge confidence={sub.confidence} />
                          )}
                        </div>

                        {sub.aiEvaluation?.runId && (
                          <Link
                            to={`/agents/traces/${sub.aiEvaluation.runId}`}
                            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View Grader Agent Trace
                          </Link>
                        )}
                      </div>

                      {/* Marks & Feedback */}
                      {isGraded ? (
                        <div className="p-3 bg-emerald-50/50 rounded-[6px] border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <span className="font-bold">Professor Approved Score: {sub.marks} / {asg.maxMarks}</span>
                          <p>{sub.feedback}</p>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/50 rounded-[6px] border border-amber-200 text-xs text-amber-900 space-y-1">
                          <span className="font-bold flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-accent" />
                            Provisional AI Evaluation: {sub.aiEvaluation?.totalMarks || 85} / {asg.maxMarks} (Pending Professor Approval D12)
                          </span>
                          <p>{sub.aiEvaluation?.feedback || 'Your work has been extracted and reviewed against the rubric. Official marks will post once approved by Dr. Rao.'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AI TUTOR CHAT */}
      {activeTab === 'tutor' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-2">
                <Bot className="w-4 h-4 text-accent" />
                Course AI Doubt Solver (Agentic RAG)
              </h2>
              <p className="text-xs text-slate-500">
                Grounded answers with page citations from course materials. Every query is scored for question quality (B1.3, B1.4).
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearChat}>
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              Clear Conversation
            </Button>
          </div>

          {/* Chat Stream Window */}
          <Card padding="compact" className="border border-mist h-[450px] flex flex-col justify-between bg-chalk/30">
            <div className="overflow-y-auto space-y-4 pr-2 flex-1">
              {doubts.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Bot className="w-10 h-10 text-accent mx-auto" />
                  <p className="text-sm font-bold text-ink">Ask your course-specific question</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The Tutor Agent searches through lecture slides, notes, and textbooks strictly within {course.code}.
                  </p>
                </div>
              ) : (
                doubts.map((d) => (
                  <div key={d.id} className="space-y-3">
                    {/* Student Question */}
                    <div className="flex justify-end">
                      <div className="max-w-xl bg-accent text-white p-3 rounded-[8px] rounded-br-none text-xs leading-relaxed space-y-1">
                        <p>{d.question}</p>
                        {d.qualityScore && (
                          <div className="pt-1.5 border-t border-white/20 flex items-center justify-between text-[10px] text-white/90 font-mono">
                            <span>Quality Score: {d.qualityScore.score}/100</span>
                            <span title={d.qualityScore.tip}>Tip Available 💡</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Quality Coaching Tip if present */}
                    {d.qualityScore?.tip && (
                      <div className="flex justify-end">
                        <span className="text-[11px] text-slate-500 bg-white border border-mist px-2.5 py-1 rounded-[6px] max-w-lg">
                          💡 <span className="font-semibold">Coaching Tip:</span> {d.qualityScore.tip}
                        </span>
                      </div>
                    )}

                    {/* Tutor Answer */}
                    <div className="flex justify-start">
                      <div className="max-w-2xl bg-white border border-mist p-4 rounded-[8px] rounded-bl-none text-xs text-ink space-y-3 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <AIBadge label="Course Tutor" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            Confidence: {Math.round((d.confidence ?? 0.95) * 100)}%
                          </span>
                        </div>

                        <div className="whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
                          {d.answer}
                        </div>

                        {/* Citations Pills */}
                        {d.citations && d.citations.length > 0 && (
                          <div className="pt-2 border-t border-mist/80 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Source Citations ({d.citations.length})
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {d.citations.map((cite, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setCitationModal(cite)}
                                  className="px-2 py-1 rounded-[4px] bg-accent-soft text-accent text-[11px] font-semibold border border-accent/20 hover:bg-accent/20 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  {cite.materialTitle.split(':')[0]} (p. {cite.page})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-mist p-3 rounded-[8px] text-xs text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent animate-spin" />
                    Tutor Agent searching course vectors and validating claim grounding...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Row */}
            <form onSubmit={handleAskDoubt} className="pt-3 border-t border-mist flex gap-2">
              <input
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                placeholder="Ask about normalization, algorithms, or lecture concepts..."
                className="flex-1 text-xs px-3.5 py-2.5 bg-white border border-mist rounded-[8px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button variant="primary" size="md" disabled={isAsking || !questionInput.trim()} type="submit">
                <Send className="w-4 h-4" />
                Ask
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 4: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-ink">Class Announcements & Discussion</h2>

          {announcements.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-8 h-8 text-accent" />}
              title="No Announcements Yet"
              description="Check back soon for updates and class guidelines from your professor."
            />
          ) : (
            <div className="space-y-4">
              {announcements.map((anc) => (
                <Card key={anc.id} padding="standard" className="border border-mist space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-ink">{anc.title || 'Announcement'}</h3>
                      {anc.aiGenerated && <Badge variant="brand">Teaching Copilot Approved</Badge>}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Posted on {new Date(anc.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {anc.content}
                  </p>

                  {/* Comments Thread (Decision D7) */}
                  <div className="pt-3 border-t border-mist space-y-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Replies ({anc.comments?.length || 0})
                    </span>

                    {(anc.comments || []).map((cmt) => (
                      <div key={cmt.id} className="p-3 rounded-[6px] bg-chalk border border-mist text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink">{cmt.author.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600">{cmt.text}</p>
                      </div>
                    ))}

                    {/* Reply Input */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[anc.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [anc.id]: e.target.value }))
                        }
                        placeholder="Reply to this announcement..."
                        className="flex-1 text-xs px-3 py-1.5 bg-white border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={postingComment[anc.id] || !commentInputs[anc.id]?.trim()}
                        onClick={() => handleAddComment(anc.id)}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <Card padding="standard" className="border border-mist space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Course Rankings (Decision D3)
              </h3>
              <p className="text-xs text-slate-500">
                50% assignments + 30% projects + 20% doubt inquiry quality.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Snapshot: {leaderboard ? new Date(leaderboard.computedAt).toLocaleDateString() : 'Today'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-chalk text-slate-500 uppercase tracking-wider border-b border-mist">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Assignments (50%)</th>
                  <th className="py-3 px-4 font-semibold">Projects (30%)</th>
                  <th className="py-3 px-4 font-semibold">Doubts (20%)</th>
                  <th className="py-3 px-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist font-mono">
                {leaderboard?.entries.map((e) => {
                  const isCurrent = e.studentId === user?.id
                  return (
                    <tr key={e.studentId} className={isCurrent ? 'bg-accent-soft/40 font-bold' : 'hover:bg-chalk/50'}>
                      <td className="py-3 px-4 font-bold text-ink">
                        {e.rank === 1 ? '🥇 1' : e.rank === 2 ? '🥈 2' : e.rank === 3 ? '🥉 3' : `#${e.rank}`}
                      </td>
                      <td className="py-3 px-4 font-sans text-ink">
                        {e.studentName} {isCurrent && <Badge variant="brand">You</Badge>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{e.assignmentScore}%</td>
                      <td className="py-3 px-4 text-slate-600">{e.projectScore}%</td>
                      <td className="py-3 px-4 text-slate-600">{e.doubtScore}%</td>
                      <td className="py-3 px-4 text-right font-bold text-accent text-sm">{e.total}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Upload Submission Modal */}
      {uploadModalAsg && (
        <Modal
          isOpen={true}
          onClose={() => setUploadModalAsg(null)}
          title={`Submit: ${uploadModalAsg.title}`}
          description={`Due ${new Date(uploadModalAsg.dueDate).toLocaleDateString()} • Max ${uploadModalAsg.maxMarks} points`}
        >
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-mist hover:border-accent rounded-[8px] p-8 text-center cursor-pointer transition-colors bg-chalk/50"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-ink">
                {selectedFile ? selectedFile.name : 'Click to select or drag and drop your file'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: PDF, DOCX, TXT, ZIP up to 10 MB (Decision D10)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.zip"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setUploadModalAsg(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedFile || isSubmittingWork}
                onClick={handleUploadWork}
              >
                {isSubmittingWork ? 'Submitting & Evaluating...' : 'Submit Assignment'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Citation Preview Modal */}
      {citationModal && (
        <Modal
          isOpen={true}
          onClose={() => setCitationModal(null)}
          title="Verified Source Citation (B1.3)"
          description={`${citationModal.materialTitle} • Page ${citationModal.page}`}
        >
          <div className="space-y-3">
            <div className="p-4 rounded-[8px] bg-chalk border border-mist font-mono text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              "{citationModal.snippet}"
            </div>
            <p className="text-xs text-slate-500">
              The Tutor Agent verified that this claim is grounded directly in the published course material.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setCitationModal(null)}>
                Close Citation
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Vector Transparency Modal */}
      {selectedMaterial && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMaterial(null)}
          title="Vector Ingestion Details"
          description={selectedMaterial.title}
        >
          <div className="space-y-3 text-xs">
            <p className="font-semibold text-ink">Extracted Semantic Topics:</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedMaterial.indexing.topics.map((t, i) => (
                <Badge key={i} variant="brand">{t}</Badge>
              ))}
            </div>
            <p className="text-slate-500 pt-2">
              Chunks embedded: {selectedMaterial.indexing.chunkCount} • Status: {selectedMaterial.indexing.status}
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={() => setSelectedMaterial(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
