/**
 * Admin Courses Directory page (Section 4 + Milestone 7).
 * Platform-wide index of all university departments, courses, and active enrollment codes.
 */
import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Search, Copy, Check } from 'lucide-react'
import type { CourseWithDetails } from '@/types/domain'
import { getAdminCourses } from '@/services/admin'

export const AdminCoursesDirectory: React.FC = () => {
  const [courses, setCourses] = useState<CourseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      try {
        const data = await getAdminCourses()
        setCourses(Array.isArray(data) ? data : [])
      } catch {
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.department && c.department.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold text-ink">Institutional Courses Catalog</h1>
        <p className="text-sm text-slate-500">
          Platform-wide directory of all active university courses, departments, and enrollment codes.
        </p>
      </div>

      <Card padding="compact" className="border border-mist flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by course code, name, or department..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-chalk border border-mist rounded-[6px] text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <span className="text-xs text-slate-400 font-mono ml-auto">
          {filtered.length} active courses
        </span>
      </Card>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((course) => (
            <Card key={course.id} padding="standard" className="border border-mist space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-[4px] bg-accent-soft text-accent">
                      {course.code}
                    </span>
                    <Badge variant="neutral">{course.term || 'Fall 2026'}</Badge>
                  </div>
                  <h3 className="text-base font-bold text-ink">{course.name}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => copyCode(course.enrollmentCode)}
                  className="px-2.5 py-1 rounded-[6px] bg-chalk border border-mist text-slate-600 hover:text-accent hover:border-accent text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Copy Enrollment Code"
                >
                  {copiedCode === course.enrollmentCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{course.enrollmentCode}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {course.description}
              </p>

              <div className="pt-2 border-t border-mist/80 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Instructor: {course.professor?.name || 'Dr. Faculty'}</span>
                <span>{course.studentCount} students • {course.materialCount} materials</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
