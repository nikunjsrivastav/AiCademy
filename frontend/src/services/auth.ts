/** PDF Section 5.1: Authentication. */
import type { AuthResponse, LoginRequest, MeResponse, RegisterRequest } from '@/types/api'
import { http } from './http'

/** POST /api/auth/register */
export async function register(body: RegisterRequest): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/register', body)
  return data
}

/** POST /api/auth/login */
export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>('/auth/login', body)
  return data
}

/** GET /api/auth/me */
export async function getMe(): Promise<MeResponse> {
  const { data } = await http.get<MeResponse>('/auth/me')
  return data
}
