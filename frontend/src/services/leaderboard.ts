/**
 * Leaderboard Service calling Section 5.4 routes from /docs/ARCHITECTURE_SOURCE.md.
 * Intercepted by MSW in Phase 0; calls Express backend in Phase 1.
 */
import { http } from './http'
import type { Leaderboard } from '@/types/domain'

export interface EnrichedLeaderboardEntry {
  studentId: string
  studentName: string
  studentEmail: string
  studentNumber?: string
  avatarHue?: number
  rank: number
  assignmentScore: number
  projectScore: number
  doubtScore: number
  total: number
}

export interface EnrichedLeaderboard extends Omit<Leaderboard, 'entries'> {
  entries: EnrichedLeaderboardEntry[]
}

/**
 * Retrieve course leaderboard rankings (Section 5.4: GET /api/leaderboard/:courseId).
 */
export async function getCourseLeaderboard(courseId: string): Promise<EnrichedLeaderboard> {
  const res = await http.get<EnrichedLeaderboard>(`/leaderboard/${courseId}`)
  return res.data
}

/**
 * Recalculate rankings based on 50% assignments + 30% projects + 20% doubt quality (Section 5.4 + Decision D3).
 */
export async function recomputeLeaderboard(courseId: string): Promise<EnrichedLeaderboard> {
  const res = await http.post<EnrichedLeaderboard>(`/leaderboard/${courseId}/recompute`)
  return res.data
}
