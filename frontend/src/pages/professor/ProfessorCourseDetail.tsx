import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  FileText,
  Trash2,
  Users,
  FileSpreadsheet,
  FileCode,
  File,
  Layers,
  Sparkles,
  Award,
  BarChart2,
  MessageSquare,
  Plus,
  Edit3,
} from 'lucide-react'
import { getCourse, updateCourse, listCourseStudents } from '@/services/courses'
import {
  listCourseMaterials,
  uploadMaterial,
  deleteMaterial,
  reindexMaterial,
} from '@/services/materials'
import { listCourseAssignments, createAssignment } from '@/services/assignments'
import { listAssignmentSubmissions, scoreSubmission } from '@/services/submissions'
import { getCourseAnalytics, type CourseAnalytics } from '@/services/analytics'
import { listCourseAnnouncements, createAnnouncement } from '@/services/announcements'
import { getCourseLeaderboard, recomputeLeaderboard, type EnrichedLeaderboard } from '@/services/leaderboard'
import type { CourseWithDetails, Material, User, Assignment, Submission, Announcement } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Modal } from '@/components/ui/Modal'
import { AIBadge } from '@/components/ui/AIBadge'
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/services/http'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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

export const ProfessorCourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const { showToast } = useToast()

  const [course, setCourse] = useState<CourseWithDetails | null>(null)
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'roster' | 'analytics' | 'announcements' | 'leaderboard'>('materials')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Copy code feedback
  const [isCopied, setIsCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Materials tab state
  const [materials, setMaterials] = useState<Material[]>([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [reindexingIds, setReindexingIds] = useState<Record<string, boolean>>({})
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null)

  // Assignments tab state
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [isCreateAsgOpen, setIsCreateAsgOpen] = useState(false)
  const [asgTitle, setAsgTitle] = useState('')
  const [asgDesc, setAsgDesc] = useState('')
  const [asgClass, setAsgClass] = useState<'assignment' | 'project'>('assignment')
  const [asgDueDate, setAsgDueDate] = useState('')
  const [rubricRows, setRubricRows] = useState<{ title: string; description: string; maxMarks: number }[]>([
    { title: 'Core Implementation', description: 'Functional correctness against requirements', maxMarks: 60 },
    { title: 'Empirical Analysis', description: 'Complexity and edge-case evaluation', maxMarks: 40 },
  ])
  const [isCreatingAsg, setIsCreatingAsg] = useState(false)

  // Grading Override modal state
  const [gradingSub, setGradingSub] = useState<Submission | null>(null)
  const [overrideMarks, setOverrideMarks] = useState<number>(85)
  const [overrideFeedback, setOverrideFeedback] = useState<string>('')
  const [isSavingScore, setIsSavingScore] = useState(false)

  // Students roster tab state
  const [students, setStudents] = useState<User[]>([])
  const [studentSearch, setStudentSearch] = useState('')

  // Analytics tab state
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null)

  // Announcements tab state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isCreateAncOpen, setIsCreateAncOpen] = useState(false)
  const [ancTitle, setAncTitle] = useState('')
  const [ancContent, setAncContent] = useState('')
  const [isPostingAnc, setIsPostingAnc] = useState(false)

  // Leaderboard tab state
  const [leaderboard, setLeaderboard] = useState<EnrichedLeaderboard | null>(null)
  const [recomputingLdb, setRecomputingLdb] = useState(false)

  const fetchData = useCallback(async () => {
    if (!courseId) return
    try {
      setIsLoading(true)
      setError(null)
      const [cData, mData, sData, aData] = await Promise.all([
        getCourse(courseId),
        listCourseMaterials(courseId),
        listCourseStudents(courseId),
        listCourseAssignments(courseId),
      ])
      setCourse(cData)
      setMaterials(mData)
      setStudents(sData)
      setAssignments(aData)
      if (aData.length > 0 && !selectedAsg) {
        setSelectedAsg(aData[0])
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [courseId, selectedAsg])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch submissions when selected assignment changes
  useEffect(() => {
    if (!selectedAsg) return
    setLoadingSubs(true)
    listAssignmentSubmissions(selectedAsg.id)
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubs(false))
  }, [selectedAsg])

  // Lazy tab loader
  useEffect(() => {
    if (!courseId) return
    if (activeTab === 'analytics') {
      getCourseAnalytics(courseId).then(setAnalytics).catch(() => {})
    } else if (activeTab === 'announcements') {
      listCourseAnnouncements(courseId).then(setAnnouncements).catch(() => {})
    } else if (activeTab === 'leaderboard') {
      getCourseLeaderboard(courseId).then(setLeaderboard).catch(() => {})
    }
  }, [activeTab, courseId])

  const copyCode = () => {
    if (!course) return
    navigator.clipboard.writeText(course.enrollmentCode)
    setIsCopied(true)
    showToast('Enrollment code copied to clipboard!', 'success')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleRegenerateCode = async () => {
    if (!course) return
    try {
      setIsRegenerating(true)
      const updated = await updateCourse(course.id, {
        regenerateEnrollmentCode: true,
      })
      setCourse((prev) => (prev ? { ...prev, enrollmentCode: updated.enrollmentCode } : null))
      showToast('Enrollment code regenerated!', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsRegenerating(false)
    }
  }

  // Material upload
  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !selectedFile || !uploadTitle.trim()) return
    setIsUploading(true)
    try {
      const newMat = await uploadMaterial({
        courseId,
        title: uploadTitle.trim(),
        description: uploadDesc.trim(),
        file: selectedFile,
      })
      setMaterials((prev) => [newMat, ...prev])
      setIsUploadOpen(false)
      setSelectedFile(null)
      setUploadTitle('')
      setUploadDesc('')
      showToast('Material uploaded and auto-indexed by Ingestion Agent!', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  // Material reindex
  const handleReindex = async (materialId: string) => {
    setReindexingIds((prev) => ({ ...prev, [materialId]: true }))
    try {
      const res = await reindexMaterial(materialId)
      setMaterials((prev) => prev.map((m) => (m.id === materialId ? res.material : m)))
      showToast('Ingestion Agent reindexed document vector chunks.', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setReindexingIds((prev) => ({ ...prev, [materialId]: false }))
    }
  }

  // Delete material
  const handleDeleteMaterial = async () => {
    if (!deleteTarget) return
    try {
      await deleteMaterial(deleteTarget.id)
      setMaterials((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Material deleted from course.', 'info')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    }
  }

  // Rubric builder handlers
  const handleAddRubricRow = () => {
    setRubricRows((prev) => [...prev, { title: '', description: '', maxMarks: 20 }])
  }

  const handleRemoveRubricRow = (index: number) => {
    setRubricRows((prev) => prev.filter((_, i) => i !== index))
  }

  const totalRubricMarks = rubricRows.reduce((acc, cur) => acc + (Number(cur.maxMarks) || 0), 0)

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !asgTitle.trim() || !asgDueDate) return
    setIsCreatingAsg(true)
    try {
      const created = await createAssignment({
        courseId,
        title: asgTitle.trim(),
        description: asgDesc.trim(),
        classification: asgClass,
        dueDate: new Date(asgDueDate).toISOString(),
        maxMarks: totalRubricMarks,
        rubric: rubricRows,
      })
      setAssignments((prev) => [created, ...prev])
      setSelectedAsg(created)
      setIsCreateAsgOpen(false)
      showToast('Assignment and Rubric created successfully!', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsCreatingAsg(false)
    }
  }

  // Override / Score submission
  const handleSaveScore = async () => {
    if (!gradingSub) return
    setIsSavingScore(true)
    try {
      const scored = await scoreSubmission(gradingSub.id, {
        marks: overrideMarks,
        feedback: overrideFeedback,
      })
      setSubmissions((prev) => prev.map((s) => (s.id === scored.id ? scored : s)))
      setGradingSub(null)
      showToast('Score and feedback saved.', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsSavingScore(false)
    }
  }

  // Post announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !ancContent.trim()) return
    setIsPostingAnc(true)
    try {
      const created = await createAnnouncement({
        courseId,
        title: ancTitle.trim() || 'Course Announcement',
        content: ancContent.trim(),
      })
      setAnnouncements((prev) => [created, ...prev])
      setIsCreateAncOpen(false)
      setAncTitle('')
      setAncContent('')
      showToast('Announcement published to class.', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsPostingAnc(false)
    }
  }

  // Recompute leaderboard
  const handleRecomputeLeaderboard = async () => {
    if (!courseId) return
    setRecomputingLdb(true)
    try {
      const updated = await recomputeLeaderboard(courseId)
      setLeaderboard(updated)
      showToast('Leaderboard rankings recomputed (D3 formula snapshot saved).', 'success')
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setRecomputingLdb(false)
    }
  }

  const filteredMaterials = materials.filter((m) => {
    const q = materialSearch.toLowerCase().trim()
    if (!q) return true
    return m.title.toLowerCase().includes(q) || m.fileName.toLowerCase().includes(q)
  })

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase().trim()
    if (!q) return true
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  if (isLoading && !course) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full rounded-[8px]" />
        <Skeleton className="h-10 w-full rounded-[8px]" />
        <Skeleton className="h-64 w-full rounded-[8px]" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto py-8">
        <Link to="/p/courses" className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to courses
        </Link>
        <ErrorState message={error || 'Course not found'} onRetry={fetchData} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/p/courses" className="hover:text-accent flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Courses
        </Link>
        <span>/</span>
        <span className="font-semibold text-ink">{course.code}</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-[8px] border border-mist bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold px-3 py-1 rounded-[6px] bg-accent-soft text-accent">
                {course.code}
              </span>
              <Badge variant="neutral">{course.term || 'Fall 2026'}</Badge>
              <AIBadge label="Autonomous Ingestion & Grading" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {course.name}
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">{course.description}</p>
          </div>

          {/* Active Enrollment Code Pill */}
          <div className="p-3 rounded-[8px] bg-chalk border border-mist flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Enrollment Code
              </span>
              <span className="font-mono text-base font-bold text-ink">{course.enrollmentCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="p-2 rounded-[6px] hover:bg-slate-200 transition-colors cursor-pointer text-slate-600"
              title="Copy Code"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              className="p-2 rounded-[6px] hover:bg-slate-200 transition-colors cursor-pointer text-slate-600"
              title="Regenerate Code"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-mist gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'materials' ? 'border-accent text-accent font-bold' : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <Layers className="w-4 h-4" />
          Materials ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'assignments' ? 'border-accent text-accent font-bold' : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <FileText className="w-4 h-4" />
          Assignments & Rubrics ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'roster' ? 'border-accent text-accent font-bold' : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Roster ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'analytics' ? 'border-accent text-accent font-bold' : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Analytics (Section 5.4)
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'announcements' ? 'border-accent text-accent font-bold' : 'border-transparent text-slate-500 hover:text-ink'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Announcements
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'leaderboard' ? 'border-accent text-accent font-bold' : 'border-transparent text-slate-500 hover:text-ink'
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
            <h2 className="text-base font-bold text-ink">Material Manager & Vector Indexing</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Search materials..."
                className="text-xs px-3 py-1.5 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                <UploadCloud className="w-4 h-4" />
                Upload Material
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMaterials.map((mat) => (
              <Card key={mat.id} padding="compact" className="border border-mist flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-[8px] bg-chalk border border-mist shrink-0">
                    {getFileIcon(mat.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-ink">{mat.title}</h3>
                      <Badge variant={mat.indexing.status === 'indexed' ? 'success' : 'warning'}>
                        {mat.indexing.status} ({mat.indexing.chunkCount} chunks)
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{mat.fileName} • {formatFileSize(mat.fileSize)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={reindexingIds[mat.id]}
                    onClick={() => handleReindex(mat.id)}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reindexingIds[mat.id] ? 'animate-spin' : ''}`} />
                    Reindex (Ingestion Agent)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(mat)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS & RUBRICS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Assignments & AI Rubric Studio</h2>
              <p className="text-xs text-slate-500">
                Create structured assignments with criteria points. Review AI evaluation proposals and override marks.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsCreateAsgOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </div>

          {/* Assignment Selector Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {assignments.map((asg) => (
              <button
                key={asg.id}
                onClick={() => setSelectedAsg(asg)}
                className={`px-3.5 py-2 rounded-[8px] text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  selectedAsg?.id === asg.id
                    ? 'bg-accent text-white border-accent shadow-xs'
                    : 'bg-white text-ink border-mist hover:border-slate-300'
                }`}
              >
                {asg.title}
              </button>
            ))}
          </div>

          {/* Selected Assignment Submissions Roster */}
          {selectedAsg && (
            <Card padding="standard" className="border border-mist space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-mist pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] bg-accent-soft text-accent">
                      {selectedAsg.classification}
                    </span>
                    <h3 className="text-base font-bold text-ink">{selectedAsg.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Max Marks: {selectedAsg.maxMarks} • Due {new Date(selectedAsg.dueDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {submissions.length} Submissions Received
                  </span>
                </div>
              </div>

              {/* Submissions Table */}
              {loadingSubs ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : submissions.length === 0 ? (
                <EmptyState
                  icon={<FileText className="w-8 h-8 text-accent" />}
                  title="No Submissions Yet"
                  description="Students enrolled in this course have not submitted work for this assignment."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-chalk text-slate-500 uppercase tracking-wider border-b border-mist">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Student</th>
                        <th className="py-3 px-4 font-semibold">File / Version</th>
                        <th className="py-3 px-4 font-semibold">Submitted At</th>
                        <th className="py-3 px-4 font-semibold">AI Evaluation (D9)</th>
                        <th className="py-3 px-4 font-semibold">Final Grade</th>
                        <th className="py-3 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-mist">
                      {submissions.map((sub) => {
                        const studentUser = students.find((s) => s.id === sub.studentId)
                        const isGraded = sub.evaluationStatus === 'graded'

                        return (
                          <tr key={sub.id} className="hover:bg-chalk/50">
                            <td className="py-3.5 px-4 font-bold text-ink">
                              {studentUser?.name || sub.studentId}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">
                              {sub.fileName} <Badge variant="neutral">v{sub.version}</Badge>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {new Date(sub.submittedAt).toLocaleDateString()}
                              {sub.late && <Badge variant="danger">Late</Badge>}
                            </td>
                            <td className="py-3.5 px-4">
                              {sub.aiEvaluation ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-accent">
                                    {sub.aiEvaluation.totalMarks}/{selectedAsg.maxMarks}
                                  </span>
                                  <ConfidenceBadge
                                    confidence={{
                                      score: sub.aiEvaluation.confidence.score,
                                      level: sub.aiEvaluation.confidence.level,
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-slate-400">Evaluating...</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold">
                              {isGraded ? (
                                <span className="text-emerald-600">{sub.marks}/{selectedAsg.maxMarks}</span>
                              ) : (
                                <Badge variant="warning">Awaiting Review (D12)</Badge>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setGradingSub(sub)
                                  setOverrideMarks(sub.marks ?? sub.aiEvaluation?.totalMarks ?? 85)
                                  setOverrideFeedback(sub.feedback || sub.aiEvaluation?.feedback || '')
                                }}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                {isGraded ? 'Override Score' : 'Review & Finalize'}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* TAB 3: ROSTER */}
      {activeTab === 'roster' && (
        <Card padding="standard" className="border border-mist space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Enrolled Student Roster ({students.length})</h3>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search students..."
              className="text-xs px-3 py-1.5 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-chalk text-slate-500 uppercase tracking-wider border-b border-mist">
                <tr>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Student Number</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-chalk/50">
                    <td className="py-3.5 px-4 font-bold text-ink">{s.name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{s.email}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{s.profile.studentNumber || '—'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="success">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="compact" className="border border-mist">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Average Grade</span>
              <p className="text-2xl font-bold text-ink">{analytics?.averageScore || 86}%</p>
              <span className="text-xs text-emerald-600 font-medium">+4% over previous cohort</span>
            </Card>

            <Card padding="compact" className="border border-mist">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Submission Rate</span>
              <p className="text-2xl font-bold text-ink">{analytics?.submissionRate || 94}%</p>
              <span className="text-xs text-slate-400">On-time completion</span>
            </Card>

            <Card padding="compact" className="border border-mist">
              <span className="text-xs font-semibold text-slate-400 block mb-1">AI Score Override Rate (D9)</span>
              <p className="text-2xl font-bold text-ink">{analytics?.overrideRate || 14}%</p>
              <span className="text-xs text-accent font-medium">Derived human alignment</span>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade Distribution */}
            <Card padding="standard" className="border border-mist space-y-4">
              <h3 className="text-sm font-bold text-ink">Score Range Distribution</h3>
              <div className="space-y-3 pt-2">
                {(analytics?.scoreDistribution || []).map((bin, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-ink">
                      <span>{bin.range}</span>
                      <span>{bin.count} students</span>
                    </div>
                    <div className="w-full bg-chalk rounded-full h-2 overflow-hidden border border-mist">
                      <div
                        className="bg-accent h-2 rounded-full"
                        style={{ width: `${Math.max(10, bin.count * 18)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Topic Difficulty */}
            <Card padding="standard" className="border border-mist space-y-4">
              <h3 className="text-sm font-bold text-ink">Curriculum Topic Friction</h3>
              <div className="space-y-3 pt-2">
                {(analytics?.topicDifficulty || []).map((t, i) => (
                  <div key={i} className="p-3 bg-chalk rounded-[6px] border border-mist text-xs space-y-1">
                    <div className="flex justify-between font-bold text-ink">
                      <span>{t.topic}</span>
                      <span className="text-accent">{t.averageMarks}% avg</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block">{t.doubtCount} doubts logged by students</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Class Announcements</h2>
            <Button variant="primary" size="sm" onClick={() => setIsCreateAncOpen(true)}>
              <Plus className="w-4 h-4" />
              Publish Announcement
            </Button>
          </div>

          <div className="space-y-4">
            {announcements.map((anc) => (
              <Card key={anc.id} padding="standard" className="border border-mist space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-ink">{anc.title || 'Announcement'}</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(anc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{anc.content}</p>
                <div className="pt-2 border-t border-mist text-xs text-slate-500 font-mono">
                  {anc.comments?.length || 0} student replies
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <Card padding="standard" className="border border-mist space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Course Rankings Snapshot (Decision D3)
              </h3>
              <p className="text-xs text-slate-500">
                Formula: 50% Assignments + 30% Projects + 20% Doubt Quality
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={recomputingLdb}
              onClick={handleRecomputeLeaderboard}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recomputingLdb ? 'animate-spin' : ''}`} />
              Recompute Rankings
            </Button>
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
                {leaderboard?.entries.map((e) => (
                  <tr key={e.studentId} className="hover:bg-chalk/50">
                    <td className="py-3 px-4 font-bold text-ink">#{e.rank}</td>
                    <td className="py-3 px-4 font-sans text-ink">{e.studentName}</td>
                    <td className="py-3 px-4 text-slate-600">{e.assignmentScore}%</td>
                    <td className="py-3 px-4 text-slate-600">{e.projectScore}%</td>
                    <td className="py-3 px-4 text-slate-600">{e.doubtScore}%</td>
                    <td className="py-3 px-4 text-right font-bold text-accent text-sm">{e.total}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create Assignment Modal with Rubric Builder */}
      {isCreateAsgOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateAsgOpen(false)}
          title="Create Assignment with Rubric (Section 5.3 + D2)"
          description="Configure rubric criteria with point allocations summing to assignment total."
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Title</label>
              <input
                type="text"
                required
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                placeholder="e.g. Assignment 2: Relational Calculus & Concurrency"
                className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Classification (D2)</label>
                <select
                  value={asgClass}
                  onChange={(e) => setAsgClass(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="assignment">Assignment (Individual)</option>
                  <option value="project">Project (Term Milestone)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={asgDueDate}
                  onChange={(e) => setAsgDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Description</label>
              <textarea
                rows={2}
                value={asgDesc}
                onChange={(e) => setAsgDesc(e.target.value)}
                placeholder="Instructions and requirements for students..."
                className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Dynamic Rubric Builder */}
            <div className="pt-2 border-t border-mist space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink uppercase tracking-wider">
                  Rubric Criteria ({rubricRows.length}) • Total: {totalRubricMarks} pts
                </span>
                <Button type="button" variant="outline" size="sm" onClick={handleAddRubricRow}>
                  <Plus className="w-3 h-3" /> Add Criterion
                </Button>
              </div>

              <div className="space-y-2">
                {rubricRows.map((row, i) => (
                  <div key={i} className="p-3 bg-chalk rounded-[6px] border border-mist flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Criterion title"
                      value={row.title}
                      onChange={(e) => {
                        const copy = [...rubricRows]
                        copy[i].title = e.target.value
                        setRubricRows(copy)
                      }}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-mist rounded-[4px] text-ink"
                    />
                    <input
                      type="number"
                      placeholder="Marks"
                      value={row.maxMarks}
                      onChange={(e) => {
                        const copy = [...rubricRows]
                        copy[i].maxMarks = Number(e.target.value)
                        setRubricRows(copy)
                      }}
                      className="w-16 text-xs px-2.5 py-1.5 bg-white border border-mist rounded-[4px] text-ink"
                    />
                    {rubricRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRubricRow(i)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-mist">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateAsgOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isCreatingAsg || totalRubricMarks === 0}>
                {isCreatingAsg ? 'Creating...' : `Publish Assignment (${totalRubricMarks} pts)`}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Grade / Override Score Modal */}
      {gradingSub && (
        <Modal
          isOpen={true}
          onClose={() => setGradingSub(null)}
          title={`Grade Review: ${gradingSub.fileName}`}
          description={`Student: ${students.find((s) => s.id === gradingSub.studentId)?.name || gradingSub.studentId}`}
        >
          <div className="space-y-4">
            {/* AI Evaluation Proposal Preview (D9) */}
            {gradingSub.aiEvaluation && (
              <div className="p-4 rounded-[8px] bg-accent-soft/30 border border-accent/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Grader Agent Proposal
                  </span>
                  <ConfidenceBadge
                    confidence={{
                      score: gradingSub.aiEvaluation.confidence.score,
                      level: gradingSub.aiEvaluation.confidence.level,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  Proposed Score:{' '}
                  <span className="font-bold text-accent">{gradingSub.aiEvaluation.totalMarks} pts</span>
                  . "{gradingSub.aiEvaluation.feedback}"
                </p>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <p>• Mistakes: {gradingSub.aiEvaluation.mistakes.join('; ')}</p>
                  <p>• Suggestions: {gradingSub.aiEvaluation.suggestions.join('; ')}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Final Approved Marks (out of {selectedAsg?.maxMarks || 100})
              </label>
              <input
                type="number"
                min="0"
                max={selectedAsg?.maxMarks || 100}
                value={overrideMarks}
                onChange={(e) => setOverrideMarks(Number(e.target.value))}
                className="w-full text-sm bg-chalk border border-mist rounded-[6px] p-2 text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Professor Feedback</label>
              <textarea
                rows={3}
                value={overrideFeedback}
                onChange={(e) => setOverrideFeedback(e.target.value)}
                placeholder="Enter custom feedback for student..."
                className="w-full text-xs bg-chalk border border-mist rounded-[6px] p-2 text-ink"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setGradingSub(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" disabled={isSavingScore} onClick={handleSaveScore}>
                {isSavingScore ? 'Saving...' : 'Finalize Grade'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Publish Announcement Modal */}
      {isCreateAncOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateAncOpen(false)}
          title="Publish Course Announcement"
          description="Post updates and review session details to all enrolled students."
        >
          <form onSubmit={handlePostAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Title</label>
              <input
                type="text"
                required
                value={ancTitle}
                onChange={(e) => setAncTitle(e.target.value)}
                placeholder="e.g. Midterm Review Session Lab"
                className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Content</label>
              <textarea
                rows={4}
                required
                value={ancContent}
                onChange={(e) => setAncContent(e.target.value)}
                placeholder="Write your message to the class..."
                className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateAncOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isPostingAnc}>
                {isPostingAnc ? 'Posting...' : 'Post Announcement'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Upload Material Modal */}
      {isUploadOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsUploadOpen(false)}
          title="Upload Course Learning Material"
          description="File will be sanitized and auto-indexed by the Ingestion Agent."
        >
          <form onSubmit={handleUploadMaterial} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Title</label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Lecture 4: Indexing & B-Trees"
                className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">Description</label>
              <textarea
                rows={2}
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Summary of syllabus topics covered..."
                className="w-full text-xs px-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink"
              />
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-mist hover:border-accent rounded-[8px] p-6 text-center cursor-pointer transition-colors bg-chalk/50"
            >
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-ink">
                {selectedFile ? selectedFile.name : 'Click to select material document'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                PDF, DOCX, PPTX, TXT, or MD up to 20MB (Decision D10)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.txt,.md"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={!selectedFile || isUploading}>
                {isUploading ? 'Uploading & Indexing...' : 'Upload & Ingest'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Material Modal */}
      {deleteTarget && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="Delete Material"
          description={`Are you sure you want to remove "${deleteTarget.title}"?`}
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              This will remove the file and clean up its vector chunks from the course-scoped collection.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleDeleteMaterial}>
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
