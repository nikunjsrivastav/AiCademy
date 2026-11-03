/**
 * Course service mapping /docs/ARCHITECTURE_SOURCE.md Section 5.2.
 * All HTTP requests route through the shared Axios client.
 */
import { http } from './http'
import type { Course, CourseWithDetails, User } from '@/types/domain'
import type {
  CreateCourseRequest,
  UpdateCourseRequest,
  EnrollCourseResponse,
} from '@/types/api'

/**
 * GET /api/courses
 * List courses relevant to the authenticated user.
 * - Student: enrolled courses
 * - Professor: created/owned courses
 * - Administrator: all institution courses
 */
export async function listCourses(params?: { term?: string }): Promise<CourseWithDetails[]> {
  const res = await http.get<CourseWithDetails[]>('/courses', { params })
  return res.data
}

/**
 * GET /api/courses/:courseId
 * EXTENSION (decision D7): fetch full details for a single course.
 */
export async function getCourse(courseId: string): Promise<CourseWithDetails> {
  const res = await http.get<CourseWithDetails>(`/courses/${courseId}`)
  return res.data
}

/**
 * POST /api/courses
 * Create a course for an authorized professor.
 */
export async function createCourse(payload: CreateCourseRequest): Promise<Course> {
  const res = await http.post<Course>('/courses', payload)
  return res.data
}

/**
 * PUT /api/courses/:courseId
 * EXTENSION (decision D7): update course details or regenerate code (D6).
 */
export async function updateCourse(courseId: string, payload: UpdateCourseRequest): Promise<Course> {
  const res = await http.put<Course>(`/courses/${courseId}`, payload)
  return res.data
}

/**
 * GET /api/courses/lookup?code=
 * EXTENSION (decision D6): preview course details by 6-character code before enrolling.
 */
export async function lookupCourseByCode(code: string): Promise<CourseWithDetails> {
  const res = await http.get<any>('/courses/lookup', {
    params: { code: code.trim().toUpperCase() },
  })
  return res.data?.course || res.data
}

/**
 * POST /api/courses/:courseId/enroll
 * Enroll a student with a valid course enrollment code.
 */
export async function enrollInCourse(
  courseId: string,
  enrollmentCode: string,
): Promise<EnrollCourseResponse> {
  const res = await http.post<any>(`/courses/${courseId}/enroll`, {
    enrollmentCode: enrollmentCode.trim().toUpperCase(),
  })
  if (res.data?.course) {
    return res.data
  }
  return {
    message: res.data?.message || 'Successfully enrolled in course',
    course: res.data,
  }
}

/**
 * GET /api/courses/:courseId/students
 * Return an authorized course roster.
 */
export async function listCourseStudents(courseId: string): Promise<User[]> {
  const res = await http.get<any>(`/courses/${courseId}/students`)
  if (Array.isArray(res.data)) {
    return res.data
  }
  return res.data?.students || []
}
