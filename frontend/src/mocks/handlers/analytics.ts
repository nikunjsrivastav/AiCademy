/**
 * MSW Handlers for Section 5.4 Analytics routes.
 * TODO(backend): replaced by Express controllers in ROADMAP Phase 1.
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb } from '../db/store'

export const analyticsHandlers = [
  // GET /api/analytics/:courseId
  http.get(api('/analytics/:courseId'), async ({ request, params }) => {
    const auth = authenticate(request, ['professor', 'administrator'])
    if (!auth.ok) return auth.response
    await latency(80, 150)

    const { courseId } = params
    const db = getDb()

    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', `Course ${courseId} not found`)
    }

    const studentCount = course.studentIds.length
    const courseSubs = db.submissions.filter((s) => s.courseId === courseId)
    const gradedSubs = courseSubs.filter((s) => s.marks !== null)

    const avg = gradedSubs.length
      ? Math.round(gradedSubs.reduce((acc, cur) => acc + (cur.marks || 0), 0) / gradedSubs.length)
      : 86

    // Grade distributions
    const ranges = [
      { range: '90-100', count: 0 },
      { range: '80-89', count: 0 },
      { range: '70-79', count: 0 },
      { range: '<70', count: 0 },
    ]

    gradedSubs.forEach((s) => {
      const m = s.marks || 0
      if (m >= 90) ranges[0].count++
      else if (m >= 80) ranges[1].count++
      else if (m >= 70) ranges[2].count++
      else ranges[3].count++
    })

    // If zero graded, add realistic defaults
    if (gradedSubs.length === 0) {
      ranges[0].count = 4
      ranges[1].count = 5
      ranges[2].count = 2
      ranges[3].count = 1
    }

    const topicDifficulty = [
      { topic: 'Relational Normalization & BCNF', averageMarks: 78, doubtCount: 16 },
      { topic: 'Query Plan & Index Optimization', averageMarks: 86, doubtCount: 9 },
      { topic: 'Buffer Pool & LRU-K Management', averageMarks: 91, doubtCount: 4 },
      { topic: 'Transaction Isolation & 2PL', averageMarks: 82, doubtCount: 11 },
    ]

    const doubtTrends = [
      { day: 'Mon', count: 3 },
      { day: 'Tue', count: 7 },
      { day: 'Wed', count: 12 },
      { day: 'Thu', count: 8 },
      { day: 'Fri', count: 5 },
      { day: 'Sat', count: 2 },
      { day: 'Sun', count: 4 },
    ]

    // Override rate (Decision D9: derived from AI proposed marks vs professor final marks)
    const overrides = gradedSubs.filter(
      (s) => s.aiEvaluation && s.aiEvaluation.totalMarks !== s.marks
    )
    const overrideRate = gradedSubs.length
      ? Math.round((overrides.length / gradedSubs.length) * 100)
      : 14

    return HttpResponse.json({
      courseId,
      studentCount,
      submissionRate: 94,
      averageScore: avg,
      scoreDistribution: ranges,
      topicDifficulty,
      doubtTrends,
      overrideRate,
    })
  }),
]
