import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import type { Course } from '../types/index.js'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function enrichCourse(course: Course, currentUserId?: string) {
  const prof = db.users.get(course.professorId)
  const materials = Array.from(db.materials.values()).filter((m) => m.courseId === course.id)
  return {
    ...course,
    studentCount: course.studentIds.length,
    materialCount: materials.length,
    isEnrolled: currentUserId ? course.studentIds.includes(currentUserId) : false,
    professor: prof
      ? {
          id: prof.id,
          name: prof.name,
          email: prof.email,
          profile: prof.profile,
        }
      : undefined,
  }
}

export async function listCourses(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  let courses: Course[] = []

  if (user.role === 'administrator') {
    courses = Array.from(db.courses.values())
  } else if (user.role === 'professor') {
    courses = Array.from(db.courses.values()).filter((c) => c.professorId === user.id)
  } else {
    courses = Array.from(db.courses.values()).filter((c) => c.studentIds.includes(user.id))
  }

  const enriched = courses.map((c) => enrichCourse(c, user.id))
  return res.json(enriched)
}

export async function lookupCourse(req: AuthenticatedRequest, res: Response) {
  const code = (req.query.code as string)?.trim().toUpperCase()
  if (!code) {
    return res.status(400).json({ code: 'INVALID_CODE', message: 'Enrollment code is required' })
  }

  const course = Array.from(db.courses.values()).find((c) => c.enrollmentCode.toUpperCase() === code)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'No course found with that enrollment code' })
  }

  return res.json(enrichCourse(course, req.user?.id))
}

export async function getCourse(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Course not found' })
  }
  return res.json(enrichCourse(course, req.user?.id))
}

export async function createCourse(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  if (user.role !== 'professor' && user.role !== 'administrator') {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only faculty members can create courses' })
  }

  const { code, name, description, department, term, hue } = req.body
  if (!code || !name) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Course code and name are required' })
  }

  const newCourse: Course = {
    id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    code: code.trim().toUpperCase(),
    name: name.trim(),
    description: description?.trim() || '',
    enrollmentCode: generateCode(),
    professorId: user.id,
    studentIds: [],
    department: department || user.profile.department || 'Computer Science',
    term: term || 'Fall 2026',
    hue: typeof hue === 'number' ? hue : Math.floor(Math.random() * 360),
    leaderboardWeights: { assignments: 0.5, projects: 0.3, doubts: 0.2 },
    createdAt: new Date().toISOString(),
  }

  db.courses.set(newCourse.id, newCourse)
  return res.status(201).json(enrichCourse(newCourse, user.id))
}

export async function enrollCourse(req: AuthenticatedRequest, res: Response) {
  const user = req.user!
  const { courseId } = req.params
  const { enrollmentCode } = req.body

  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'COURSE_NOT_FOUND', message: 'Course not found' })
  }

  if (course.enrollmentCode.toUpperCase() !== (enrollmentCode || '').trim().toUpperCase()) {
    return res.status(400).json({ code: 'INVALID_ENROLLMENT_CODE', message: 'Incorrect enrollment code' })
  }

  if (course.studentIds.includes(user.id)) {
    return res.status(409).json({ code: 'ALREADY_ENROLLED', message: 'You are already enrolled in this course' })
  }

  course.studentIds.push(user.id)
  return res.json(enrichCourse(course, user.id))
}

export async function getCourseStudents(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Course not found' })
  }

  const students = course.studentIds
    .map((id) => db.users.get(id))
    .filter((u): u is NonNullable<typeof u> => !!u)
    .map((u) => {
      const { passwordHash: _, ...rest } = u
      return rest
    })

  return res.json(students)
}

export async function regenerateCode(req: AuthenticatedRequest, res: Response) {
  const { courseId } = req.params
  const course = db.courses.get(courseId)
  if (!course) {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Course not found' })
  }

  if (req.user!.role !== 'administrator' && course.professorId !== req.user!.id) {
    return res.status(403).json({ code: 'FORBIDDEN', message: 'Only the course professor can regenerate enrollment codes' })
  }

  course.enrollmentCode = generateCode()
  return res.json({ enrollmentCode: course.enrollmentCode })
}

