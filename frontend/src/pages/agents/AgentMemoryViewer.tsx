/**
 * EXTENSION: Agent Memory Transparency Viewer from /docs/AGENTIC_DESIGN.md B4 and Decision D16.
 * Inspectable and deletable memory store tracking concept mastery, grading tones, and preferences.
 */
import React, { useState, useEffect } from 'react'
import { listAgentMemories, deleteAgentMemory } from '@/services/agents'
import type { AgentMemory } from '@/types/agents'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
} from 'lucide-react'

export const AgentMemoryViewer: React.FC = () => {
  const [courseId, setCourseId] = useState('crs_cs301')
  const [memories, setMemories] = useState<AgentMemory[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const data = await listAgentMemories(courseId)
      setMemories(data)
    } catch {
      showToast('Failed to load agent memories.', 'error')
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
          <option value="crs_cs301">CS301 Database Systems</option>
          <option value="crs_cs220">CS220 Data Structures & Algorithms</option>
          <option value="crs_ai410">AI410 Machine Learning & Neural Networks</option>
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
                    <h3 className="text-sm font-bold text-ink">{mem.key}</h3>
                    <Badge variant="neutral">Source: {mem.sourceAgent}</Badge>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-chalk p-3 rounded-[6px] border border-mist">
                    {mem.value}
                  </p>

                  <span className="text-xs text-slate-400 font-mono block">
                    Updated: {new Date(mem.updatedAt).toLocaleString()}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(mem.id)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Forget
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
