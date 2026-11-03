/**
 * MSW Handlers for Section 5.4 Leaderboard routes (Decision D3).
 * Formula: 50% assignments + 30% projects + 20% doubt quality.
 * TODO(backend): replaced by Express controllers in ROADMAP Phase 1.
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, latency } from './utils'
import { getDb, newId, saveDb } from '../db/store'
import type { Leaderboard, LeaderboardEntry } from '@/types/domain'

function calculateLeaderboard(courseId: string): Leaderboard {
  const db = getDb()
  const course = db.courses.find((c) => c.id === courseId)
  const weights = course?.leaderboardWeights || { assignments: 0.5, projects: 0.3, doubts: 0.2 }

  const studentIds = course?.studentIds || []
  const courseAssignments = db.assignments.filter((a) => a.courseId === courseId)

  const entries: LeaderboardEntry[] = studentIds.map((studentId) => {
    // 1. Assignment Score (classification: 'assignment')
    const asgIds = courseAssignments.filter((a) => a.classification === 'assignment').map((a) => a.id)
    const asgSubs = db.submissions.filter(
      (s) => s.studentId === studentId && asgIds.includes(s.assignmentId) && s.marks !== null
    )
    const asgAvg = asgSubs.length
      ? asgSubs.reduce((acc, cur) => acc + (cur.marks || 0), 0) / asgSubs.length
      : 82

    // 2. Project Score (classification: 'project')
    const projIds = courseAssignments.filter((a) => a.classification === 'project').map((a) => a.id)
    const projSubs = db.submissions.filter(
      (s) => s.studentId === studentId && projIds.includes(s.assignmentId) && s.marks !== null
    )
    const projAvg = projSubs.length
      ? projSubs.reduce((acc, cur) => acc + (cur.marks || 0), 0) / projSubs.length
      : 85

    // 3. Doubt Quality Score
    const studentDoubts = db.doubts.filter((d) => d.courseId === courseId && d.studentId === studentId)
    const validScores = studentDoubts.map((d) => d.qualityScore?.score).filter((s): s is number => typeof s === 'number')
    const doubtAvg = validScores.length
      ? validScores.reduce((acc, cur) => acc + cur, 0) / validScores.length
      : 88

    const total = Number(
      (asgAvg * weights.assignments + projAvg * weights.projects + doubtAvg * weights.doubts).toFixed(1)
    )

    return {
      studentId,
      rank: 0,
      assignmentScore: Math.round(asgAvg),
      projectScore: Math.round(projAvg),
      doubtScore: Math.round(doubtAvg),
      total,
    }
  })

  // Sort descending by total
  entries.sort((a, b) => b.total - a.total)
  entries.forEach((e, idx) => {
    e.rank = idx + 1
  })

  return {
    id: newId('ldb'),
    courseId,
    entries,
    weights,
    computedAt: new Date().toISOString(),
  }
}

export const leaderboardHandlers = [
  // GET /api/leaderboard/:courseId: retrieve rankings
  http.get(api('/leaderboard/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(50, 100)

    const { courseId } = params
    const db = getDb()

    let ldb = db.leaderboards.find((l) => l.courseId === courseId)
    if (!ldb) {
      ldb = calculateLeaderboard(courseId as string)
      db.leaderboards.push(ldb)
      saveDb()
    }

    // Enrich entries with user profile information
    const enrichedEntries = ldb.entries.map((entry) => {
      const user = db.users.find((u) => u.id === entry.studentId)
      return {
        ...entry,
        studentName: user?.name || 'Student',
        studentEmail: user?.email || '',
        studentNumber: user?.profile.studentNumber,
        avatarHue: user?.profile.avatarHue || 200,
      }
    })

    return HttpResponse.json({
      ...ldb,
      entries: enrichedEntries,
    })
  }),

  // POST /api/leaderboard/:courseId/recompute: recalculate rankings snapshot
  http.post(api('/leaderboard/:courseId/recompute'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(100, 200)

    const { courseId } = params
    const db = getDb()
    const updated = calculateLeaderboard(courseId as string)

    const existingIdx = db.leaderboards.findIndex((l) => l.courseId === courseId)
    if (existingIdx !== -1) {
      db.leaderboards[existingIdx] = updated
    } else {
      db.leaderboards.push(updated)
    }

    saveDb()

    // Enrich with user information
    const enrichedEntries = updated.entries.map((entry) => {
      const user = db.users.find((u) => u.id === entry.studentId)
      return {
        ...entry,
        studentName: user?.name || 'Student',
        studentEmail: user?.email || '',
        studentNumber: user?.profile.studentNumber,
        avatarHue: user?.profile.avatarHue || 200,
      }
    })

    return HttpResponse.json({
      ...updated,
      entries: enrichedEntries,
    })
  }),
]
