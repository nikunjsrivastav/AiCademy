/** Request/response envelopes shared by the services and the mock handlers. */
import type { Role, User, Course, CourseWithDetails, Material } from './domain'

/** Error body returned by every failing route. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: Record<string, string>
  }
}

// 5.1 Authentication
export interface RegisterRequest {
  name: string
  email: string
  password: string
  /** Administrators cannot self-register. */
  role: Exclude<Role, 'administrator'>
}

export interface LoginRequest {
  email: string
  password: string
}

/** POST /api/auth/register and /login: "return an access token". */
export interface AuthResponse {
  token: string
  user: User
}

export interface MeResponse {
  user: User
}

// 5.2 Courses and Materials
export interface CreateCourseRequest {
  code: string
  name: string
  description: string
  department?: string
  term?: string
}

export interface UpdateCourseRequest {
  name?: string
  description?: string
  department?: string
  term?: string
  regenerateEnrollmentCode?: boolean
}

export interface EnrollCourseRequest {
  enrollmentCode: string
}

export interface EnrollCourseResponse {
  message: string
  course: Course
}

export interface CourseLookupResponse {
  course: CourseWithDetails
}

export interface CourseStudentsResponse {
  students: User[]
}

export interface UploadMaterialRequest {
  courseId: string
  title: string
  description?: string
  type?: string
  fileName?: string
  fileSize?: number
  fileUrl?: string
}

export interface UpdateMaterialRequest {
  title?: string
  description?: string
}

export interface ReindexMaterialResponse {
  message: string
  material: Material
}
