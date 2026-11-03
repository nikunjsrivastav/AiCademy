import { http } from './http'
import type { User, CourseWithDetails } from '@/types/domain'

/**
 * Fetch all registered institutional users (admin only).
 */
export async function getAdminUsers(): Promise<User[]> {
  const res = await http.get<User[]>('/admin/users')
  return res.data
}

/**
 * Fetch all university courses across departments (admin only).
 */
export async function getAdminCourses(): Promise<CourseWithDetails[]> {
  const res = await http.get<CourseWithDetails[]>('/admin/courses')
  return res.data
}

