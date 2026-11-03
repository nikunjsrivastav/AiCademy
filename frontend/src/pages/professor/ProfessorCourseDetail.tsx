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
  Upload,
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
  const [asgQuestionText, setAsgQuestionText] = useState('')
  const [asgQuestionFileName, setAsgQuestionFileName] = useState('')
  const questionFileInputRef = useRef<HTMLInputElement>(null)
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
      setMaterials(Array.isArray(mData) ? mData : [])
      setStudents(Array.isArray(sData) ? sData : [])
      setAssignments(Array.isArray(aData) ? aData : [])
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

  const handleQuestionFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAsgQuestionFileName(file.name)
    try {
      const text = await file.text()
      if (text && text.trim().length > 0) {
        setAsgQuestionText(text.trim())
        showToast(`Loaded question text from ${file.name} (${text.length} chars)`, 'success')
      }
    } catch (readErr) {
      console.warn('Question file read warning:', readErr)
      showToast('Could not read text from selected file, please paste text directly.', 'error')
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!courseId || !asgTitle.trim() || !asgDueDate) return
    setIsCreatingAsg(true)
    try {
      const created = await createAssignment({
        courseId,
        title: asgTitle.trim(),
        description: asgDesc.trim(),
        questionText: asgQuestionText.trim() || undefined,
        questionFileName: asgQuestionFileName || undefined,
        classification: asgClass,
        dueDate: new Date(asgDueDate).toISOString(),
        maxMarks: totalRubricMarks,
        rubric: rubricRows,
      })
      setAssignments((prev) => [created, ...prev])
      setSelectedAsg(created)
      setIsCreateAsgOpen(false)
      setAsgQuestionText('')
      setAsgQuestionFileName('')
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

  const filteredMaterials = (materials || []).filter((m) => {
    const q = (materialSearch || '').toLowerCase().trim()
    if (!q) return true
    return (m.title || '').toLowerCase().includes(q) || (m.fileName || '').toLowerCase().includes(q)
  })

  const filteredStudents = (students || []).filter((s) => {
    const q = (studentSearch || '').toLowerCase().trim()
    if (!q) return true
    return (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
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
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link to="/p/courses" className="hover:text-accent flex items-center gap-1 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Courses
        </Link>
        <span>/</span>
        <span className="font-semibold text-fg">{course.code}</span>
      </div>

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-[8px] border border-line bg-surface shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold px-3 py-1 rounded-[6px] bg-accent-soft text-accent">
                {course.code}
              </span>
              <Badge variant="neutral">{course.term || 'Fall 2026'}</Badge>
              <AIBadge label="Autonomous Ingestion & Grading" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">
              {course.name}
            </h1>
            <p className="text-xs text-muted max-w-2xl">{course.description}</p>
          </div>

          {/* Active Enrollment Code Pill */}
          <div className="p-3 rounded-[8px] bg-surface-2 border border-line flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">
                Enrollment Code
              </span>
              <span className="font-mono text-base font-bold text-fg">{course.enrollmentCode}</span>
            </div>
            <button
              onClick={copyCode}
              className="p-2 rounded-[6px] hover:bg-surface-3 transition-colors cursor-pointer text-muted hover:text-fg"
              title="Copy Code"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              className="p-2 rounded-[6px] hover:bg-surface-3 transition-colors cursor-pointer text-muted hover:text-fg"
              title="Regenerate Code"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-line gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'materials' ? 'border-accent text-accent font-bold' : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Layers className="w-4 h-4" />
          Materials ({materials.length})
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'assignments' ? 'border-accent text-accent font-bold' : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <FileText className="w-4 h-4" />
          Assignments & Rubrics ({assignments.length})
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'roster' ? 'border-accent text-accent font-bold' : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Users className="w-4 h-4" />
          Student Roster ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'analytics' ? 'border-accent text-accent font-bold' : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Analytics
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'announcements' ? 'border-accent text-accent font-bold' : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Announcements
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'leaderboard' ? 'border-accent text-accent font-bold' : 'border-transparent text-muted hover:text-fg'
          }`}
        >
          <Award className="w-4 h-4" />
          Leaderboard
        </button>
      </div>

      {/* TAB 1: MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-fg">Material Manager & Vector Indexing</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                placeholder="Search materials..."
                className="text-xs px-3 py-1.5 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <Button variant="primary" size="sm" onClick={() => setIsUploadOpen(true)}>
                <UploadCloud className="w-4 h-4" />
                Upload Material
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMaterials.length === 0 ? (
              <EmptyState
                icon={<Layers className="w-8 h-8 text-accent" />}
                title="No Materials Uploaded Yet"
                description="Upload syllabus documents, lecture slides, or notes. The Ingestion Agent will automatically chunk and vector-index them."
              />
            ) : (
              filteredMaterials.map((mat) => (
                <Card key={mat.id} padding="compact" className="border border-line bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-[8px] bg-surface-2 border border-line shrink-0">
                      {getFileIcon(mat.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-fg">{mat.title}</h3>
                        <Badge variant={mat.indexing?.status === 'indexed' ? 'success' : 'warning'}>
                          {mat.indexing?.status || 'indexed'} ({mat.indexing?.chunkCount || 0} chunks)
                        </Badge>
                      </div>
                      <p className="text-xs text-muted">{mat.fileName || 'file'} • {formatFileSize(mat.fileSize || 0)}</p>
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
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ASSIGNMENTS & RUBRICS */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-fg">Assignments & AI Rubric Studio</h2>
              <p className="text-xs text-muted">
                Create structured assignments with criteria points. Review AI evaluation proposals and override marks.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsCreateAsgOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Assignment
            </Button>
          </div>

          {/* Assignments Content */}
          {assignments.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-accent" />}
              title="No Assignments Created Yet"
              description="Create assignments with custom rubric criteria. The autonomous Rubric Grader Agent will assess student submissions against your defined benchmarks."
              actionLabel="Create First Assignment"
              onAction={() => setIsCreateAsgOpen(true)}
            />
          ) : (
            <>
              {/* Assignment Selector Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {assignments.map((asg) => (
                  <button
                    key={asg.id}
                    onClick={() => setSelectedAsg(asg)}
                    className={`px-3.5 py-2 rounded-[8px] text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                      selectedAsg?.id === asg.id
                        ? 'bg-accent text-accent-contrast border-accent shadow-xs'
                        : 'bg-surface text-fg border-line hover:border-accent/40'
                    }`}
                  >
                    {asg.title}
                  </button>
                ))}
              </div>

              {/* Selected Assignment Submissions Roster */}
              {selectedAsg && (
                <Card padding="standard" className="border border-line bg-surface space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[4px] bg-accent-soft text-accent">
                          {selectedAsg.classification}
                        </span>
                        <h3 className="text-base font-bold text-fg">{selectedAsg.title}</h3>
                      </div>
                      <p className="text-xs text-muted">
                        Max Marks: {selectedAsg.maxMarks} • Due {new Date(selectedAsg.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted">
                        {submissions.length} Submissions Received
                      </span>
                    </div>
                  </div>

                  {/* Assignment Question Display */}
                  {selectedAsg.questionText && (
                    <div className="p-3 rounded-[6px] bg-accent-soft/30 border border-accent/20 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-fg">
                        <FileText className="w-3.5 h-3.5 text-accent" />
                        <span>Assignment Question / Problem Statement</span>
                        {selectedAsg.questionFileName && (
                          <span className="text-[10px] text-muted font-normal">({selectedAsg.questionFileName})</span>
                        )}
                      </div>
                      <p className="text-fg font-mono whitespace-pre-wrap text-[11px] max-h-36 overflow-y-auto bg-surface/80 p-2.5 rounded border border-line">
                        {selectedAsg.questionText}
                      </p>
                    </div>
                  )}

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
                        <thead className="bg-surface-2 text-muted uppercase tracking-wider border-b border-line">
                          <tr>
                            <th className="py-3 px-4 font-semibold">Student</th>
                            <th className="py-3 px-4 font-semibold">File / Version</th>
                            <th className="py-3 px-4 font-semibold">Submitted At</th>
                            <th className="py-3 px-4 font-semibold">AI Evaluation</th>
                            <th className="py-3 px-4 font-semibold">Final Grade</th>
                            <th className="py-3 px-4 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {submissions.map((sub) => {
                            const studentUser = students.find((s) => s.id === sub.studentId)
                            const isGraded = sub.evaluationStatus === 'graded'

                            return (
                              <tr key={sub.id} className="hover:bg-surface-2/60 transition-colors">
                                <td className="py-3.5 px-4 font-bold text-fg">
                                  {studentUser?.name || sub.studentId}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-muted">
                                  {sub.fileName} <Badge variant="neutral">v{sub.version}</Badge>
                                </td>
                                <td className="py-3.5 px-4 text-muted">
                                  {new Date(sub.submittedAt).toLocaleDateString()}
                                  {sub.late && <Badge variant="danger">Late</Badge>}
                                </td>
                                <td className="py-3.5 px-4">
                                  {sub.aiEvaluation ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-accent">
                                        {sub.aiEvaluation.marks ?? (sub.aiEvaluation as any).totalMarks}/{selectedAsg.maxMarks}
                                      </span>
                                      {typeof sub.aiEvaluation.confidence === 'object' && sub.aiEvaluation.confidence !== null ? (
                                        <ConfidenceBadge
                                          confidence={{
                                            score: (sub.aiEvaluation.confidence as any).score ?? 0.9,
                                            level: (sub.aiEvaluation.confidence as any).level ?? 'high',
                                          }}
                                        />
                                      ) : (
                                        <Badge variant="success">
                                          {Math.round((Number(sub.aiEvaluation.confidence) || 0.9) * 100)}% Confidence
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted">Evaluating...</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-bold">
                                  {isGraded ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">{sub.marks}/{selectedAsg.maxMarks}</span>
                                  ) : (
                                    <Badge variant="warning">Awaiting Review</Badge>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setGradingSub(sub)
                                      setOverrideMarks(sub.marks ?? sub.aiEvaluation?.marks ?? (sub.aiEvaluation as any)?.totalMarks ?? 85)
                                      setOverrideFeedback(sub.feedback || (sub.aiEvaluation as any)?.feedback || (sub.aiEvaluation as any)?.reasoning || '')
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
            </>
          )}
        </div>
      )}

      {/* TAB 3: ROSTER */}
      {activeTab === 'roster' && (
        <Card padding="standard" className="border border-line bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-fg">Enrolled Student Roster ({students.length})</h3>
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search students..."
              className="text-xs px-3 py-1.5 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {filteredStudents.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8 text-accent" />}
              title="No Students Enrolled Yet"
              description={`Share enrollment code "${course.enrollmentCode}" with your students so they can join this course.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-2 text-muted uppercase tracking-wider border-b border-line">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Student Number</th>
                    <th className="py-3 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-fg">{s.name}</td>
                      <td className="py-3.5 px-4 font-mono text-muted">{s.email}</td>
                      <td className="py-3.5 px-4 font-mono text-muted">{s.profile?.studentNumber || '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant="success">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* TAB 4: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {!analytics || !analytics.hasData || (analytics.totalSubmissions || 0) === 0 ? (
            <Card padding="loose" className="border border-line bg-surface text-center">
              <EmptyState
                icon={<BarChart2 className="w-8 h-8 text-accent" />}
                title="No Analytics Available Yet"
                description="Class performance metrics, average scores, and AI override rates will populate automatically once students submit work and grades are reviewed."
              />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="compact" className="border border-line bg-surface">
                  <span className="text-xs font-semibold text-muted block mb-1">Average Grade</span>
                  <p className="text-2xl font-bold text-fg">
                    {analytics.averageScore !== null ? `${analytics.averageScore}%` : 'N/A'}
                  </p>
                  <span className="text-xs text-muted font-medium">Across graded submissions</span>
                </Card>

                <Card padding="compact" className="border border-line bg-surface">
                  <span className="text-xs font-semibold text-muted block mb-1">Submission Rate</span>
                  <p className="text-2xl font-bold text-fg">{analytics.submissionRate}%</p>
                  <span className="text-xs text-muted">Of total expected solutions</span>
                </Card>

                <Card padding="compact" className="border border-line bg-surface">
                  <span className="text-xs font-semibold text-muted block mb-1">AI Score Override Rate</span>
                  <p className="text-2xl font-bold text-fg">{analytics.overrideRate}%</p>
                  <span className="text-xs text-accent font-medium">Faculty human alignment</span>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grade Distribution */}
                <Card padding="standard" className="border border-line bg-surface space-y-4">
                  <h3 className="text-sm font-bold text-fg">Score Range Distribution</h3>
                  <div className="space-y-3 pt-2">
                    {(analytics.distribution || analytics.scoreDistribution || []).map((bin: any, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-fg">
                          <span>{bin.range}</span>
                          <span>{bin.count} students</span>
                        </div>
                        <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden border border-line">
                          <div
                            className="bg-accent h-2 rounded-full transition-all"
                            style={{
                              width: `${analytics.totalSubmissions ? Math.min(100, Math.round((bin.count / analytics.totalSubmissions) * 100)) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Topic Difficulty */}
                <Card padding="standard" className="border border-line bg-surface space-y-4">
                  <h3 className="text-sm font-bold text-fg">Curriculum Topic Friction</h3>
                  {(analytics.topicDifficulty && analytics.topicDifficulty.length > 0) ? (
                    <div className="space-y-3 pt-2">
                      {analytics.topicDifficulty.map((t: any, i: number) => (
                        <div key={i} className="p-3 bg-surface-2 rounded-[6px] border border-line text-xs space-y-1">
                          <div className="flex justify-between font-bold text-fg">
                            <span>{t.topic}</span>
                            <span className="text-accent">{t.averageMarks}% avg</span>
                          </div>
                          <span className="text-[11px] text-muted block">{t.doubtCount} doubts logged by students</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted pt-2">No topic friction or student doubts recorded yet.</p>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 5: ANNOUNCEMENTS */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-fg">Class Announcements</h2>
            <Button variant="primary" size="sm" onClick={() => setIsCreateAncOpen(true)}>
              <Plus className="w-4 h-4" />
              Publish Announcement
            </Button>
          </div>

          {announcements.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="w-8 h-8 text-accent" />}
              title="No Announcements Published Yet"
              description="Share lecture notes, exam guidelines, or schedule updates with the class."
              actionLabel="Publish First Announcement"
              onAction={() => setIsCreateAncOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {announcements.map((anc) => (
                <Card key={anc.id} padding="standard" className="border border-line bg-surface space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-fg">{anc.title || 'Announcement'}</h3>
                    <span className="text-xs text-muted font-mono">
                      {new Date(anc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-fg leading-relaxed whitespace-pre-line">{anc.content}</p>
                  <div className="pt-2 border-t border-line text-xs text-muted font-mono">
                    {anc.comments?.length || 0} student replies
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <Card padding="standard" className="border border-line bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-fg flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Course Rankings Snapshot
              </h3>
              <p className="text-xs text-muted">
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

          {(leaderboard?.entries || []).length === 0 ? (
            <EmptyState
              icon={<Award className="w-8 h-8 text-accent" />}
              title="No Rankings Computed Yet"
              description="Rankings compute automatically using the weighted D3 formula (50% Assignments, 30% Projects, 20% Doubts) as students participate."
              actionLabel="Compute Initial Snapshot"
              onAction={handleRecomputeLeaderboard}
            />
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
                    <th className="py-3 px-4 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono">
                  {(leaderboard?.entries || []).map((e) => (
                    <tr key={e.studentId} className="hover:bg-surface-2/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-fg">#{e.rank}</td>
                      <td className="py-3 px-4 font-sans text-fg">{e.studentName}</td>
                      <td className="py-3 px-4 text-muted">{e.assignmentScore}%</td>
                      <td className="py-3 px-4 text-muted">{e.projectScore}%</td>
                      <td className="py-3 px-4 text-muted">{e.doubtScore}%</td>
                      <td className="py-3 px-4 text-right font-bold text-accent text-sm">{e.total}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Create Assignment Modal with Rubric Builder */}
      {isCreateAsgOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCreateAsgOpen(false)}
          title="Create Assignment with Rubric"
          description="Configure question specifications and rubric criteria summing to assignment total."
          size="lg"
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-fg mb-1">Title</label>
              <input
                type="text"
                required
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                placeholder="e.g. Assignment 2: Relational Calculus & Concurrency"
                className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Classification</label>
                <select
                  value={asgClass}
                  onChange={(e) => setAsgClass(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="assignment">Assignment (Individual)</option>
                  <option value="project">Project (Term Milestone)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-fg mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={asgDueDate}
                  onChange={(e) => setAsgDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1">Description / Overview</label>
              <textarea
                rows={2}
                value={asgDesc}
                onChange={(e) => setAsgDesc(e.target.value)}
                placeholder="Brief summary of assignment goals..."
                className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Assignment Question / Problem Statement File & Text */}
            <div className="space-y-2 p-3 rounded-[8px] bg-accent-soft/30 border border-accent/25">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-fg flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-accent" />
                    Assignment Question / Problem Statement File
                  </label>
                  <p className="text-[11px] text-muted">
                    Upload a question text file (.txt, .md, code) or type/paste the questions below. The AI Evaluator grades student submissions against this exact question.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => questionFileInputRef.current?.click()}
                    className="text-xs gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    {asgQuestionFileName ? 'Change File' : 'Upload Question File'}
                  </Button>
                  <input
                    ref={questionFileInputRef}
                    type="file"
                    accept=".txt,.md,.pdf,.py,.java,.cpp,.c,.js,.ts"
                    className="hidden"
                    onChange={handleQuestionFileUpload}
                  />
                </div>
              </div>

              {asgQuestionFileName && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1 bg-surface rounded-[4px] border border-line text-[11px] text-accent">
                  <span className="truncate font-mono">Loaded from: {asgQuestionFileName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAsgQuestionFileName('')
                      setAsgQuestionText('')
                    }}
                    className="text-muted hover:text-rose-500 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              <textarea
                rows={4}
                value={asgQuestionText}
                onChange={(e) => setAsgQuestionText(e.target.value)}
                placeholder={`Example:\nQuestion 1 (40 pts): Implement Dijkstra's algorithm using a min-heap priority queue.\nQuestion 2 (30 pts): Prove the time complexity O((V + E) log V).\nQuestion 3 (30 pts): Edge case analysis with disconnected vertices.`}
                className="w-full text-xs font-mono px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            {/* Dynamic Rubric Builder */}
            <div className="pt-2 border-t border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-fg uppercase tracking-wider">
                  Rubric Criteria ({rubricRows.length}) • Total: {totalRubricMarks} pts
                </span>
                <Button type="button" variant="outline" size="sm" onClick={handleAddRubricRow}>
                  <Plus className="w-3 h-3" /> Add Criterion
                </Button>
              </div>

              <div className="space-y-2">
                {rubricRows.map((row, i) => (
                  <div key={i} className="p-3 bg-surface-2 rounded-[6px] border border-line flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Criterion title"
                      value={row.title}
                      onChange={(e) => {
                        const copy = [...rubricRows]
                        copy[i].title = e.target.value
                        setRubricRows(copy)
                      }}
                      className="flex-1 text-xs px-2.5 py-1.5 bg-surface border border-line rounded-[4px] text-fg placeholder:text-muted"
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
                      className="w-16 text-xs px-2.5 py-1.5 bg-surface border border-line rounded-[4px] text-fg placeholder:text-muted"
                    />
                    {rubricRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRubricRow(i)}
                        className="p-1.5 text-muted hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 sm:p-6 bg-surface/95 dark:bg-surface/90 backdrop-blur-md flex justify-end gap-2 border-t border-line mt-4 z-10 shadow-sm">
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
                  <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-accent" />
                    Grader Agent Proposal
                  </span>
                  {typeof gradingSub.aiEvaluation.confidence === 'object' && gradingSub.aiEvaluation.confidence !== null ? (
                    <ConfidenceBadge
                      confidence={{
                        score: (gradingSub.aiEvaluation.confidence as any).score ?? 0.9,
                        level: (gradingSub.aiEvaluation.confidence as any).level ?? 'high',
                      }}
                    />
                  ) : (
                    <Badge variant="success">
                      {Math.round((Number(gradingSub.aiEvaluation.confidence) || 0.9) * 100)}% Confidence
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-fg leading-relaxed font-sans">
                  Proposed Score:{' '}
                  <span className="font-bold text-accent">
                    {gradingSub.aiEvaluation.marks ?? (gradingSub.aiEvaluation as any).totalMarks} pts
                  </span>
                  . "{(gradingSub.aiEvaluation as any).feedback || (gradingSub.aiEvaluation as any).reasoning || 'Evaluated against rubric standards'}"
                </p>
                <div className="text-[11px] text-muted space-y-0.5">
                  <p>• Mistakes: {gradingSub.aiEvaluation.mistakes?.join('; ') || 'None'}</p>
                  <p>• Suggestions: {gradingSub.aiEvaluation.suggestions?.join('; ') || 'None'}</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-fg mb-1">
                Final Approved Marks (out of {selectedAsg?.maxMarks || 100})
              </label>
              <input
                type="number"
                min="0"
                max={selectedAsg?.maxMarks || 100}
                value={overrideMarks}
                onChange={(e) => setOverrideMarks(Number(e.target.value))}
                className="w-full text-sm bg-surface-2 border border-line rounded-[6px] p-2 text-fg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1">Professor Feedback</label>
              <textarea
                rows={3}
                value={overrideFeedback}
                onChange={(e) => setOverrideFeedback(e.target.value)}
                placeholder="Enter custom feedback for student..."
                className="w-full text-xs bg-surface-2 border border-line rounded-[6px] p-2 text-fg placeholder:text-muted"
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
              <label className="block text-xs font-semibold text-fg mb-1">Title</label>
              <input
                type="text"
                required
                value={ancTitle}
                onChange={(e) => setAncTitle(e.target.value)}
                placeholder="e.g. Midterm Review Session Lab"
                className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1">Content</label>
              <textarea
                rows={4}
                required
                value={ancContent}
                onChange={(e) => setAncContent(e.target.value)}
                placeholder="Write your message to the class..."
                className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted"
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
              <label className="block text-xs font-semibold text-fg mb-1">Title</label>
              <input
                type="text"
                required
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Lecture 4: Indexing & B-Trees"
                className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1">Description</label>
              <textarea
                rows={2}
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                placeholder="Summary of syllabus topics covered..."
                className="w-full text-xs px-3 py-2 bg-surface-2 border border-line rounded-[6px] text-fg placeholder:text-muted"
              />
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-line hover:border-accent rounded-[8px] p-6 text-center cursor-pointer transition-colors bg-surface-2/50"
            >
              <UploadCloud className="w-8 h-8 text-muted mx-auto mb-2" />
              <p className="text-xs font-bold text-fg">
                {selectedFile ? selectedFile.name : 'Click to select material document'}
              </p>
              <p className="text-[11px] text-muted mt-1">
                PDF, DOCX, PPTX, TXT, or MD up to 20MB
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
