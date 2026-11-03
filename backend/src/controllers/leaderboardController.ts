import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Leaderboard, LeaderboardEntry } from '../types/index.js'

export async function computeLeaderboard(courseId: string): Promise<Leaderboard> {
  const course = await db.getCourse(courseId)
  const studentIds = course ? course.studentIds : []
  const students = (
    await Promise.all(studentIds.map((id) => db.getUser(id)))
  ).filter((u): u is NonNullable<typeof u> => !!u)

  const weights = course?.leaderboardWeights || { assignments: 0.5, projects: 0.3, doubts: 0.2 }

  const allSubmissions = await db.getSubmissionsByCourse(courseId)
  const allDoubts = await db.getDoubtsByCourse(courseId)

  const entries: (LeaderboardEntry & { total: number })[] = students.map((student) => {
    // Collect student's real submissions in this course
    const subs = allSubmissions.filter(
      (s) => s.studentId === student.id && s.marks !== null && typeof s.marks === 'number'
    )
    const doubtList = allDoubts.filter((d) => d.studentId === student.id)

    const avgAsg = subs.length > 0 ? Math.round(subs.reduce((acc, s) => acc + (s.marks || 0), 0) / subs.length) : 0
    const avgProj = 0
    const avgDoubt = doubtList.length > 0
      ? Math.round(doubtList.reduce((acc, d) => acc + (d.quality?.score || 70), 0) / doubtList.length)
      : 0

    const total = Math.round(avgAsg * weights.assignments + avgProj * weights.projects + avgDoubt * weights.doubts)

    return {
      studentId: student.id,
      studentName: student.name,
      avatarHue: student.profile?.avatarHue || 200,
      rank: 0,
      totalScore: total,
      total,
      assignmentScore: avgAsg,
      projectScore: avgProj,
      doubtScore: avgDoubt,
    }
  })

  // Sort descending by totalScore and assign ranks
  entries.sort((a, b) => b.totalScore - a.totalScore)
  entries.forEach((e, i) => {
    e.rank = i + 1
  })

  const leaderboard: Leaderboard = {
    courseId,
    updatedAt: new Date().toISOString(),
    entries,
  }

  db.leaderboards.set(courseId, leaderboard)
  return leaderboard
}

export async function getLeaderboard(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  let lb = db.leaderboards.get(courseId)
  if (!lb) {
    lb = await computeLeaderboard(courseId)
  }
  return res.json(lb)
}

export async function recomputeLeaderboard(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const lb = await computeLeaderboard(courseId)
  return res.json(lb)
}

