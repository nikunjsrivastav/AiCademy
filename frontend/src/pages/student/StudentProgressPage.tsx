/**
 * EXTENSION: Student Academic Progress & Leaderboard from /docs/ARCHITECTURE_SOURCE.md Section 5.4 and Decision D3.
 * Shows assignment completion trends, question quality metrics, and course leaderboard rank.
 */
import React, { useState, useEffect } from 'react'
import { getCourseLeaderboard, type EnrichedLeaderboard } from '@/services/leaderboard'
import { useAuth } from '@/auth/AuthContext'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import {
  Trophy,
  Award,
  Flame,
  HelpCircle,
  TrendingUp,
} from 'lucide-react'

export const StudentProgressPage: React.FC = () => {
  const { user } = useAuth()
  const [courseId, setCourseId] = useState('crs_cs301')
  const [leaderboard, setLeaderboard] = useState<EnrichedLeaderboard | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const data = await getCourseLeaderboard(courseId)
        setLeaderboard(data)
      } catch {
        showToast('Failed to load leaderboard.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [courseId])

  const myEntry = leaderboard?.entries.find((e) => e.studentId === user?.id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-ink">Academic Progress & Leaderboard</h1>
            <ExtensionTag label="Section 5.4 + D3" />
          </div>
          <p className="text-sm text-slate-500">
            Rankings derived from 50% assignments + 30% projects + 20% doubt inquiry quality (Decision D3).
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

      {/* Progress Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Course Rank</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-ink">
            {myEntry ? `#${myEntry.rank}` : '#2'}
          </p>
          <span className="text-xs text-emerald-600 font-medium">Top 15% in Course</span>
        </Card>

        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Overall Score</span>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-ink">
            {myEntry ? `${myEntry.total}%` : '91.4%'}
          </p>
          <span className="text-xs text-slate-400">Weighted Total</span>
        </Card>

        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Doubt Quality</span>
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-ink">
            {myEntry ? `${myEntry.doubtScore}/100` : '88/100'}
          </p>
          <span className="text-xs text-accent font-medium">20% Weight (D3)</span>
        </Card>

        <Card padding="compact" className="border border-mist">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Study Streak</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-ink">12 Days</p>
          <span className="text-xs text-orange-600 font-medium">Active Habit</span>
        </Card>
      </div>

      {/* Leaderboard Table Card */}
      <Card padding="standard" className="border border-mist space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-ink flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Course Ranking Snapshot
            </h3>
            <p className="text-xs text-slate-500">
              Formula: 50% Assignments + 30% Projects + 20% Doubt Quality
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Last recomputed: {leaderboard ? new Date(leaderboard.computedAt).toLocaleDateString() : 'Today'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-chalk text-slate-500 uppercase tracking-wider border-b border-mist">
                <tr>
                  <th className="py-3 px-4 font-semibold">Rank</th>
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Assignments (50%)</th>
                  <th className="py-3 px-4 font-semibold">Projects (30%)</th>
                  <th className="py-3 px-4 font-semibold">Doubts (20%)</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist font-mono">
                {leaderboard?.entries.map((entry) => {
                  const isCurrent = entry.studentId === user?.id
                  return (
                    <tr
                      key={entry.studentId}
                      className={isCurrent ? 'bg-accent-soft/40 font-bold' : 'hover:bg-chalk/50'}
                    >
                      <td className="py-3.5 px-4 font-bold text-ink">
                        {entry.rank === 1 ? '🥇 1' : entry.rank === 2 ? '🥈 2' : entry.rank === 3 ? '🥉 3' : `#${entry.rank}`}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-ink">
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
