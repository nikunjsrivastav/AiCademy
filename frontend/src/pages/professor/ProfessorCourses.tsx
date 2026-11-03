import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Search,
  Users,
  FileText,
  Copy,
  Check,
  ArrowRight,
  GraduationCap,
} from 'lucide-react'
import { listCourses, createCourse } from '@/services/courses'
import type { CourseWithDetails } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/services/http'

export const ProfessorCourses: React.FC = () => {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Create Course Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newDept, setNewDept] = useState('Computer Science')
  const [newTerm, setNewTerm] = useState('Fall 2026')
  const [newDesc, setNewDesc] = useState('')

  // Copied code feedback tracking
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await listCourses()
      setCourses(data)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleCopyCode = (courseId: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(courseId)
    showToast(`Enrollment code "${code}" copied to clipboard!`, 'info')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim() || !newName.trim()) {
      showToast('Please enter course code and course title.', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      const created = await createCourse({
        code: newCode.trim(),
        name: newName.trim(),
        department: newDept.trim(),
        term: newTerm.trim(),
        description: newDesc.trim(),
      })
      showToast(`Course ${created.code} created! Enrollment code: ${created.enrollmentCode}`, 'success')
      setIsCreateOpen(false)
      setNewCode('')
      setNewName('')
      setNewDesc('')
      await fetchCourses()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.enrollmentCode.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-fg tracking-tight">
              Course Studio
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-[6px] bg-accent-soft text-accent">
              {courses.length} Active Courses
            </span>
          </div>
          <p className="text-sm text-charcoal mt-1">
            Organize courses, distribute enrollment codes, publish materials, and trigger vector ingestion.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Create New Course
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-charcoal/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by code, title, or enrollment code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-surface border border-line rounded-[8px] text-fg placeholder:text-charcoal/50 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 bg-surface border border-line rounded-[8px] space-y-4">
              <Skeleton className="h-6 w-24 rounded-[6px]" />
              <Skeleton className="h-6 w-3/4 rounded-[4px]" />
              <Skeleton className="h-12 w-full rounded-[4px]" />
              <div className="pt-4 border-t border-line flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24 rounded-[8px]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCourses} />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-charcoal" />}
          title={searchQuery ? 'No courses match your query' : 'No courses created yet'}
          description={
            searchQuery
              ? 'Try searching with a different course code or keyword.'
              : 'Create your first course to share enrollment codes with students and upload syllabus materials.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Create Course'}
          onAction={() => {
            if (searchQuery) setSearchQuery('')
            else setIsCreateOpen(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="group flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(40,46,62,0.1)] transition-all duration-200 border-line hover:border-accent/40"
            >
              <div className="space-y-3.5">
                {/* Badges row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[6px] bg-accent-soft text-accent tracking-wide">
                    {course.code}
                  </span>
                  <Badge variant="neutral" size="sm">
                    {course.term || 'Fall 2026'}
                  </Badge>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold font-sans text-fg group-hover:text-accent transition-colors leading-snug">
                    {course.name}
                  </h3>
                  <p className="text-xs text-charcoal/80 mt-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Enrollment Code Banner */}
                <div className="p-3 bg-surface-2 rounded-[8px] border border-line flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-charcoal tracking-wider block">
                      Enrollment Code
                    </span>
                    <span className="font-mono text-sm font-bold text-fg tracking-wider">
                      {course.enrollmentCode}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={
                      copiedId === course.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={() => handleCopyCode(course.id, course.enrollmentCode)}
                  >
                    {copiedId === course.id ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Bottom Meta & Action */}
              <div className="pt-4 mt-4 border-t border-line flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-charcoal">
                  <span className="flex items-center gap-1" title="Enrolled students">
                    <Users className="w-3.5 h-3.5 text-charcoal/60" />
                    <span className="font-semibold text-fg">{course.studentCount}</span> students
                  </span>
                  <span className="flex items-center gap-1" title="Materials uploaded">
                    <FileText className="w-3.5 h-3.5 text-accent" />
                    <span className="font-semibold text-fg">{course.materialCount}</span> materials
                  </span>
                </div>

                <Link to={`/p/courses/${course.id}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    Manage
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-accent" />
            <span>Create New University Course</span>
          </div>
        }
        description="Set up a new course. An enrollment code will be automatically generated for student self-registration."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fg uppercase tracking-wider mb-1.5">
                Course Code *
              </label>
              <input
                type="text"
                placeholder="e.g. CS450"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[8px] text-fg uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-fg uppercase tracking-wider mb-1.5">
                Term
              </label>
              <input
                type="text"
                placeholder="e.g. Fall 2026"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg uppercase tracking-wider mb-1.5">
              Course Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Advanced Distributed Systems"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg uppercase tracking-wider mb-1.5">
              Department
            </label>
            <input
              type="text"
              placeholder="e.g. Computer Science"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg uppercase tracking-wider mb-1.5">
              Course Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of course scope, prerequisites, and learning objectives..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-surface border border-line rounded-[8px] text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="p-3 bg-accent-soft/40 rounded-[8px] border border-accent/20 text-xs text-charcoal">
            💡 <strong className="text-fg">Note:</strong> A 6-character enrollment code will be generated upon creation. You can regenerate it anytime from the course settings.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Create Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default ProfessorCourses
