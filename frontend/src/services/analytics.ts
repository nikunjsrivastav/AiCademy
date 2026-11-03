/**
 * Analytics Service calling Section 5.4 route /api/analytics/:courseId.
 * Intercepted by MSW in Phase 0; calls Express backend in Phase 1.
 */
import { http } from './http'

export interface CourseAnalytics {
  courseId: string
  studentCount: number
  submissionRate: number
  averageScore: number
  scoreDistribution: { range: string; count: number }[]
  topicDifficulty: { topic: string; averageMarks: number; doubtCount: number }[]
  doubtTrends: { day: string; count: number }[]
  overrideRate: number
}

/**
 * Return professor-facing learning analytics for course (Section 5.4).
 */
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  const res = await http.get<CourseAnalytics>(`/analytics/${courseId}`)
  return res.data
}
