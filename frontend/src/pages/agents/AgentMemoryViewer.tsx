/**
 * EXTENSION: Agent Memory Viewer from /docs/AGENTIC_DESIGN.md B4 and Decision D16.
 * Provides complete transparency into student memory profiles and allows self-deletion.
 */
import React, { useState, useEffect } from 'react'
import { listAgentMemories, deleteAgentMemory } from '@/services/agents'
import { listCourses } from '@/services/courses'
import { useAuth } from '@/auth/AuthContext'
import type { AgentMemory } from '@/types/agents'
import type { Course } from '@/types/domain'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import {
  Brain,
  Trash2,
  Shield,
  BookOpen,
} from 'lucide-react'

export const AgentMemoryViewer: React.FC = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [courseId, setCourseId] = useState<string>('')
  const [memories, setMemories] = useState<AgentMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(true)
  const { showToast } = useToast()

  // 1. Fetch real courses based on user role
  useEffect(() => {
    let mounted = true
    const loadCourses = async () => {
      setCoursesLoading(true)
      try {
        const list = await listCourses()
        if (mounted) {
          setCourses(list)
          if (list.length > 0) {
            setCourseId(list[0].id)
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
  }, [user])

  // 2. Fetch memories for selected course
  const fetchMemories = async () => {
    if (!courseId) {
      setMemories([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await listAgentMemories(courseId)
      setMemories(data)
    } catch {
      setMemories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [courseId])

  const handleDelete = async (memoryId: string) => {
    try {
      await deleteAgentMemory(memoryId)
      showToast('Agent memory removed per your privacy request (D16).', 'success')
      fetchMemories()
    } catch {
      showToast('Could not remove memory.', 'error')
    }
  }

  if (coursesLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Skeleton className="h-12 w-64 rounded-[8px]" />
        <Skeleton className="h-24 w-full rounded-[8px]" />
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl font-bold text-ink">Agent Memory Transparency</h1>
          <p className="text-sm text-slate-500">
            Audit agent-remembered learning traits, weak concepts, and feedback tone guidelines.
          </p>
        </div>
        <Card padding="standard" className="border border-mist">
          <EmptyState
            icon={<BookOpen className="w-10 h-10 text-accent" />}
            title="No Courses Available"
            description={
              user?.role === 'student'
                ? 'Join a course with an enrollment code to see personalized agent memory traces.'
                : 'Create a course to audit student memory profiles.'
            }
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
            <h1 className="text-2xl font-bold text-ink">Agent Memory Transparency</h1>
            <ExtensionTag label="Inspectable State" />
            <AIBadge label="Privacy-Preserving" />
          </div>
          <p className="text-sm text-slate-500">
            Audit agent-remembered learning traits, weak concepts, and feedback tone guidelines.
            You have the right to delete your memory entries (Decision D16).
          </p>
        </div>

        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="text-xs bg-chalk border border-mist rounded-[6px] px-3 py-2 text-ink font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code}: {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-4 rounded-[8px] bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <span className="font-bold">Principle of Transparent Memory (B4, D16):</span> Agents
          cannot delete data, but humans retain full ownership over their memory profiles. Deleting
          a memory entry instructs agents to re-evaluate concepts without historical priors.
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-[8px]" />
          <Skeleton className="h-24 w-full rounded-[8px]" />
        </div>
      ) : memories.length === 0 ? (
        <EmptyState
          icon={<Brain className="w-8 h-8 text-accent" />}
          title="No Memories Stored for this Course"
          description="As you submit assignments and consult the AI Tutor, adaptive memory entries will appear here."
        />
      ) : (
        <div className="space-y-3">
          {memories.map((mem) => (
            <Card key={mem.id} padding="standard" className="border border-mist">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-accent-soft text-accent rounded-[4px]">
                      {mem.scope}
                    </span>
                    <span className="text-xs text-slate-400">
                      Agent: {mem.sourceAgent}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(mem.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-ink">{mem.key}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{mem.value}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(mem.id)}
                  className="text-rose-600 hover:text-rose-700 hover:border-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
