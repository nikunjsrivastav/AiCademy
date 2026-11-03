/**
 * Analytics Service calling Section 5.4 route /api/analytics/:courseId.
 * Intercepted by MSW in Phase 0; calls Express backend in Phase 1.
 */
import { http } from './http'

export interface CourseAnalytics {
  courseId: string
  hasData?: boolean
  totalSubmissions?: number
  totalStudents?: number
  totalAssignments?: number
  totalMaterials?: number
  gradedSubmissions?: number
  studentCount?: number
  submissionRate: number
  averageScore: number | null
  distribution?: { range: string; count: number }[]
  scoreDistribution: { range: string; count: number }[]
  topicDifficulty: { topic: string; averageMarks: number; doubtCount: number }[]
  doubtTrends: { day: string; count: number }[]
  overrideRate: number
  recentActivity?: Array<{ type: string; text: string; timestamp: string }>
}

/**
 * Return professor-facing learning analytics for course (Section 5.4).
 */
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  const res = await http.get<CourseAnalytics>(`/analytics/${courseId}`)
  return res.data
}
