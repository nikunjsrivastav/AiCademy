import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Plus,
  Search,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
} from 'lucide-react'
import { listCourses, lookupCourseByCode, enrollInCourse } from '@/services/courses'
import type { CourseWithDetails } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { useToast } from '@/components/ui/Toast'
import { errorMessage } from '@/services/http'

export const StudentCourses: React.FC = () => {
  const { showToast } = useToast()
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Enrollment Modal state
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [enrollCode, setEnrollCode] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [previewCourse, setPreviewCourse] = useState<CourseWithDetails | null>(null)
  const [isEnrolling, setIsEnrolling] = useState(false)

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

  // Handle live course lookup when code reaches 6 chars
  const handleCodeChange = async (val: string) => {
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setEnrollCode(cleaned)
    setLookupError(null)
    setPreviewCourse(null)

    if (cleaned.length === 6) {
      try {
        setIsLookingUp(true)
        const course = await lookupCourseByCode(cleaned)
        setPreviewCourse(course)
      } catch (err) {
        setLookupError(errorMessage(err))
      } finally {
        setIsLookingUp(false)
      }
    }
  }

  const handleEnrollSubmit = async () => {
    if (!previewCourse) return
    try {
      setIsEnrolling(true)
      const res = await enrollInCourse(previewCourse.id, enrollCode)
      showToast(res.message, 'success')
      setIsJoinOpen(false)
      setEnrollCode('')
      setPreviewCourse(null)
      await fetchCourses()
    } catch (err) {
      showToast(errorMessage(err), 'error')
    } finally {
      setIsEnrolling(false)
    }
  }

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.professor?.name.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold font-sans text-fg tracking-tight">
              My Enrolled Courses
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-[6px] bg-accent-soft text-accent">
              {courses.length} Active
            </span>
          </div>
          <p className="text-sm text-charcoal mt-1">
            Access lecture materials, RAG-indexed syllabus citations, and doubt-solving study tools.
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setEnrollCode('')
            setPreviewCourse(null)
            setLookupError(null)
            setIsJoinOpen(true)
          }}
        >
          Join Course with Code
        </Button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-charcoal/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by course code, title, or professor..."
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
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20 rounded-[6px]" />
                <Skeleton className="h-5 w-16 rounded-[6px]" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-[4px]" />
              <Skeleton className="h-12 w-full rounded-[4px]" />
              <div className="pt-4 border-t border-line flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-28 rounded-[8px]" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCourses} />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8 text-charcoal" />}
          title={searchQuery ? 'No courses match your query' : 'No courses joined yet'}
          description={
            searchQuery
              ? 'Try searching with a different course code, department, or keyword.'
              : 'Enter a 6-character course code from your professor to access materials and agentic study tools.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Join with Code'}
          onAction={() => {
            if (searchQuery) setSearchQuery('')
            else setIsJoinOpen(true)
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="group flex flex-col justify-between hover:shadow-[0_4px_16px_rgba(40,46,62,0.1)] transition-all duration-200 border-line hover:border-accent/40"
            >
              <div className="space-y-3">
                {/* Course Badges Top Row */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-[6px] bg-accent-soft text-accent tracking-wide">
                    {course.code}
                  </span>
                  <span className="text-xs text-charcoal font-medium">
                    {course.term || 'Fall 2026'}
                  </span>
                </div>

                {/* Course Title */}
                <div>
                  <h3 className="text-lg font-bold font-sans text-fg group-hover:text-accent transition-colors leading-snug">
                    {course.name}
                  </h3>
                  <p className="text-xs text-charcoal/80 mt-1 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Instructor Information */}
                {course.professor && (
                  <div className="flex items-center gap-2 pt-2 text-xs text-fg">
                    <div className="w-6 h-6 rounded-full bg-accent-soft text-accent flex items-center justify-center font-bold text-[10px]">
                      {course.professor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-fg">{course.professor.name}</span>
                    <span className="text-charcoal/50">•</span>
                    <span className="text-charcoal truncate">{course.department || 'Computer Science'}</span>
                  </div>
                )}
              </div>

              {/* Bottom Meta & Action */}
              <div className="pt-4 mt-4 border-t border-line flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-charcoal">
                  <span className="flex items-center gap-1" title="Materials uploaded">
                    <FileText className="w-3.5 h-3.5 text-accent" />
                    <span className="font-semibold text-fg">{course.materialCount}</span> materials
                  </span>
                  <span className="flex items-center gap-1" title="Classmates enrolled">
                    <Users className="w-3.5 h-3.5 text-charcoal/60" />
                    <span>{course.studentCount}</span>
                  </span>
                </div>

                <Link to={`/s/courses/${course.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3 h-3 text-accent" />}
                  >
                    Open
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Join Course Modal */}
      <Modal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-accent" />
            <span>Enroll in Course</span>
            <ExtensionTag />
          </div>
        }
        description="Enter the 6-character alphanumeric enrollment code provided by your course professor."
      >
        <div className="space-y-5 pt-2">
          {/* Code Input */}
          <div>
            <label className="block text-xs font-semibold text-fg uppercase tracking-wider mb-2">
              Enrollment Code
            </label>
            <input
              type="text"
              placeholder="e.g. DB301X"
              maxLength={6}
              value={enrollCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full text-center font-mono text-2xl font-bold tracking-[0.25em] px-4 py-3 bg-surface border-2 border-line rounded-[8px] text-fg uppercase focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              autoFocus
            />
            <p className="text-xs text-charcoal mt-1 text-center">
              Enter the 6-character enrollment code provided by your course professor.
            </p>
          </div>

          {/* Lookup Status & Live Preview */}
          {isLookingUp ? (
            <div className="p-4 bg-surface-2 rounded-[8px] border border-line flex items-center justify-center gap-2 text-xs text-charcoal">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span>Looking up course details...</span>
            </div>
          ) : lookupError ? (
            <div className="p-3 bg-[#fff0f0] border border-[#f5c2c2] text-[#d83a31] rounded-[8px] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{lookupError}</span>
            </div>
          ) : previewCourse ? (
            <div className="p-4 bg-accent-soft/40 rounded-[8px] border border-accent/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-[6px] bg-accent text-accent-contrast">
                  {previewCourse.code}
                </span>
                <span className="text-xs text-charcoal font-medium">
                  {previewCourse.term || 'Fall 2026'}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-fg">{previewCourse.name}</h4>
                <p className="text-xs text-charcoal mt-1 line-clamp-2">{previewCourse.description}</p>
              </div>
              <div className="text-xs text-fg flex items-center gap-2 pt-1 border-t border-[#d9dde8]">
                <span className="text-charcoal">Instructor:</span>
                <span className="font-semibold">{previewCourse.professor?.name}</span>
                <span className="text-charcoal/50">•</span>
                <span className="text-charcoal">{previewCourse.materialCount} materials indexed</span>
              </div>

              {previewCourse.isEnrolled && (
                <div className="p-2 bg-white/80 rounded-[6px] text-xs text-[#282e3e] flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You are already enrolled in this course.</span>
                </div>
              )}
            </div>
          ) : null}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <Button
              variant="secondary"
              onClick={() => setIsJoinOpen(false)}
              disabled={isEnrolling}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEnrollSubmit}
              isLoading={isEnrolling}
              disabled={!previewCourse || previewCourse.isEnrolled || isLookingUp}
            >
              Confirm Enrollment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
export default StudentCourses
