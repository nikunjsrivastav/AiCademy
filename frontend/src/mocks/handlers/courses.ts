/**
 * MSW handlers for /api/courses routes (PDF Section 5.2 + EXTENSIONS).
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency, toPublicUser } from './utils'
import { getDb, saveDb, newId } from '../db/store'
import type { Course, CourseWithDetails } from '@/types/domain'
import type {
  CreateCourseRequest,
  UpdateCourseRequest,
  EnrollCourseRequest,
  EnrollCourseResponse,
  CourseLookupResponse,
  CourseStudentsResponse,
} from '@/types/api'

function generateEnrollmentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function enrichCourse(course: Course, currentUserId?: string): CourseWithDetails {
  const db = getDb()
  const prof = db.users.find((u) => u.id === course.professorId)
  const materialCount = db.materials.filter((m) => m.courseId === course.id).length
  return {
    ...course,
    professor: prof
      ? { id: prof.id, name: prof.name, email: prof.email, profile: prof.profile }
      : undefined,
    studentCount: course.studentIds.length,
    materialCount,
    isEnrolled: currentUserId ? course.studentIds.includes(currentUserId) : false,
  }
}

export const courseHandlers = [
  // EXTENSION: GET /api/courses/lookup?code=
  // Placed before /:courseId to prevent path collision
  http.get(api('/courses/lookup'), async ({ request }) => {
    await latency(100, 250)
    const auth = authenticate(request)
    if (!auth.ok) return auth.response

    const url = new URL(request.url)
    const code = (url.searchParams.get('code') ?? '').trim().toUpperCase()
    if (!code) {
      return errorResponse(400, 'BAD_REQUEST', 'Enrollment code is required.')
    }

    const course = getDb().courses.find(
      (c) => c.enrollmentCode.trim().toUpperCase() === code,
    )
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', 'No active course found with this enrollment code.')
    }

    return HttpResponse.json<CourseLookupResponse>({
      course: enrichCourse(course, auth.user.id),
    })
  }),

  // GET /api/courses - List courses relevant to authenticated user
  http.get(api('/courses'), async ({ request }) => {
    await latency(150, 300)
    const auth = authenticate(request)
    if (!auth.ok) return auth.response

    const db = getDb()
    let filteredCourses: Course[] = []

    if (auth.user.role === 'student') {
      filteredCourses = db.courses.filter((c) => c.studentIds.includes(auth.user.id))
    } else if (auth.user.role === 'professor') {
      filteredCourses = db.courses.filter((c) => c.professorId === auth.user.id)
    } else {
      // Administrator sees all
      filteredCourses = db.courses
    }

    const enriched = filteredCourses.map((c) => enrichCourse(c, auth.user.id))
    return HttpResponse.json<CourseWithDetails[]>(enriched)
  }),

  // EXTENSION: GET /api/courses/:courseId - Get single course details
  http.get(api('/courses/:courseId'), async ({ request, params }) => {
    await latency(100, 250)
    const auth = authenticate(request)
    if (!auth.ok) return auth.response

    const courseId = params.courseId as string
    const course = getDb().courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', 'Course not found.')
    }

    return HttpResponse.json<CourseWithDetails>(enrichCourse(course, auth.user.id))
  }),

  // POST /api/courses - Create course (professor only)
  http.post(api('/courses'), async ({ request }) => {
    await latency(200, 400)
    const auth = authenticate(request, ['professor'])
    if (!auth.ok) return auth.response

    const body = (await request.json()) as CreateCourseRequest
    if (!body.code?.trim() || !body.name?.trim()) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Course code and title are required.')
    }

    const db = getDb()
    const existing = db.courses.find(
      (c) => c.code.toLowerCase() === body.code.trim().toLowerCase(),
    )
    if (existing) {
      return errorResponse(
        409,
        'COURSE_EXISTS',
        `Course code "${body.code.toUpperCase()}" already exists.`,
      )
    }

    let code = generateEnrollmentCode()
    while (db.courses.some((c) => c.enrollmentCode === code)) {
      code = generateEnrollmentCode()
    }

    const newCourse: Course = {
      id: newId('crs'),
      code: body.code.trim().toUpperCase(),
      name: body.name.trim(),
      description: body.description?.trim() ?? '',
      department: body.department?.trim() ?? auth.user.profile.department ?? 'Computer Science',
      term: body.term?.trim() ?? 'Fall 2026',
      enrollmentCode: code,
      professorId: auth.user.id,
      studentIds: [],
      hue: Math.floor(Math.random() * 360),
      createdAt: new Date().toISOString(),
      leaderboardWeights: { assignments: 0.5, projects: 0.3, doubts: 0.2 },
    }

    db.courses.unshift(newCourse)
    saveDb()

    return HttpResponse.json<Course>(newCourse, { status: 201 })
  }),

  // EXTENSION: PUT /api/courses/:courseId - Update course or regenerate code (professor only)
  http.put(api('/courses/:courseId'), async ({ request, params }) => {
    await latency(150, 300)
    const auth = authenticate(request, ['professor'])
    if (!auth.ok) return auth.response

    const courseId = params.courseId as string
    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', 'Course not found.')
    }
    if (course.professorId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'You can only edit courses you own.')
    }

    const body = (await request.json()) as UpdateCourseRequest

    if (body.name !== undefined) course.name = body.name.trim()
    if (body.description !== undefined) course.description = body.description.trim()
    if (body.department !== undefined) course.department = body.department.trim()
    if (body.term !== undefined) course.term = body.term.trim()
    if (body.regenerateEnrollmentCode) {
      course.enrollmentCode = generateEnrollmentCode()
    }

    saveDb()
    return HttpResponse.json<Course>(course)
  }),

  // POST /api/courses/:courseId/enroll - Enroll student with code
  http.post(api('/courses/:courseId/enroll'), async ({ request, params }) => {
    await latency(200, 350)
    const auth = authenticate(request, ['student'])
    if (!auth.ok) return auth.response

    const courseId = params.courseId as string
    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', 'Course not found.')
    }

    const body = (await request.json()) as EnrollCourseRequest
    const inputCode = (body.enrollmentCode ?? '').trim().toUpperCase()

    if (inputCode !== course.enrollmentCode.trim().toUpperCase()) {
      return errorResponse(
        400,
        'INVALID_CODE',
        'The enrollment code is invalid. Please verify the code with your instructor.',
      )
    }

    if (course.studentIds.includes(auth.user.id)) {
      return errorResponse(
        409,
        'ALREADY_ENROLLED',
        `You are already enrolled in ${course.code} - ${course.name}.`,
      )
    }

    course.studentIds.push(auth.user.id)
    saveDb()

    return HttpResponse.json<EnrollCourseResponse>({
      message: `Enrolled successfully in ${course.code} - ${course.name}`,
      course,
    })
  }),

  // GET /api/courses/:courseId/students - Return authorized course roster
  http.get(api('/courses/:courseId/students'), async ({ request, params }) => {
    await latency(150, 300)
    const auth = authenticate(request)
    if (!auth.ok) return auth.response

    const courseId = params.courseId as string
    const db = getDb()
    const course = db.courses.find((c) => c.id === courseId)
    if (!course) {
      return errorResponse(404, 'NOT_FOUND', 'Course not found.')
    }

    // Check membership
    const isEnrolled = course.studentIds.includes(auth.user.id)
    const isOwner = course.professorId === auth.user.id
    const isAdmin = auth.user.role === 'administrator'
    if (!isEnrolled && !isOwner && !isAdmin) {
      return errorResponse(403, 'FORBIDDEN', 'You do not have access to this course roster.')
    }

    const students = db.users
      .filter((u) => course.studentIds.includes(u.id))
      .map(toPublicUser)

    return HttpResponse.json<CourseStudentsResponse>({ students })
  }),
]
