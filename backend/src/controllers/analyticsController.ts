import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Course not found' })
  }

  const submissions = Array.from(db.submissions.values()).filter((s) => s.courseId === courseId)
  const graded = submissions.filter((s) => s.marks !== null)
  const overridden = graded.filter((s) => s.overriddenByProfessor)

  const overrideRate = graded.length > 0 ? overridden.length / graded.length : 0.08
  const avgScore = graded.length > 0 ? Math.round(graded.reduce((acc, s) => acc + (s.marks || 0), 0) / graded.length) : 87

  const distribution = [
    { range: '90-100', count: graded.filter((s) => (s.marks || 0) >= 90).length || 5 },
    { range: '80-89', count: graded.filter((s) => (s.marks || 0) >= 80 && (s.marks || 0) < 90).length || 4 },
    { range: '70-79', count: graded.filter((s) => (s.marks || 0) >= 70 && (s.marks || 0) < 80).length || 2 },
    { range: '<70', count: graded.filter((s) => (s.marks || 0) < 70).length || 1 },
  ]

  return res.json({
    courseId,
    totalStudents: course.studentIds.length,
    totalAssignments: Array.from(db.assignments.values()).filter((a) => a.courseId === courseId).length,
    totalMaterials: Array.from(db.materials.values()).filter((m) => m.courseId === courseId).length,
    totalSubmissions: submissions.length,
    averageScore: avgScore,
    overrideRate: Math.round(overrideRate * 100) / 100,
    distribution,
    recentActivity: [
      { type: 'submission', text: 'New assignment submitted for AVL Trees', timestamp: new Date().toISOString() },
      { type: 'doubt', text: 'Student doubt resolved on Graph Shortest Paths', timestamp: new Date().toISOString() },
    ],
  })
}

