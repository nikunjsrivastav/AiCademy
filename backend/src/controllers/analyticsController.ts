import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const course = await db.getCourse(courseId)
  if (!course) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Course not found' })
  }

  const submissions = await db.getSubmissionsByCourse(courseId)
  const assignments = await db.getAssignmentsByCourse(courseId)
  const materials = await db.getMaterialsByCourse(courseId)

  const graded = submissions.filter((s) => s.marks !== null && typeof s.marks === 'number')
  const overridden = graded.filter((s) => s.overriddenByProfessor)

  const hasData = graded.length > 0
  const overrideRate = hasData ? Math.round((overridden.length / graded.length) * 100) : 0
  const avgScore = hasData
    ? Math.round(graded.reduce((acc, s) => acc + (s.marks || 0), 0) / graded.length)
    : null

  // Real distribution buckets derived strictly from real graded records
  const distribution = [
    { range: '90-100', count: graded.filter((s) => (s.marks || 0) >= 90).length },
    { range: '80-89', count: graded.filter((s) => (s.marks || 0) >= 80 && (s.marks || 0) < 90).length },
    { range: '70-79', count: graded.filter((s) => (s.marks || 0) >= 70 && (s.marks || 0) < 80).length },
    { range: '<70', count: graded.filter((s) => (s.marks || 0) < 70).length },
  ]

  // Actual submission completion rate
  const totalStudents = Math.max(1, course.studentIds.length)
  const totalExpected = assignments.length * totalStudents
  const submissionRate = assignments.length > 0
    ? Math.min(100, Math.round((submissions.length / totalExpected) * 100))
    : 0

  return res.json({
    courseId,
    hasData,
    totalStudents: course.studentIds.length,
    studentCount: course.studentIds.length,
    totalAssignments: assignments.length,
    totalMaterials: materials.length,
    totalSubmissions: submissions.length,
    gradedSubmissions: graded.length,
    averageScore: avgScore,
    submissionRate,
    overrideRate,
    distribution: hasData ? distribution : [],
    scoreDistribution: hasData ? distribution : [],
    topicDifficulty: [],
    doubtTrends: [],
    recentActivity: [],
  })
}

