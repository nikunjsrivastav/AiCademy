/**
 * Axios instance used by every service. This is the ONLY HTTP entry point of the app.
 * Swapping to the real backend = change VITE_API_BASE_URL and set VITE_USE_MOCKS=false.
 */
import axios, { AxiosError } from 'axios'
import { API_BASE_URL } from '@/config'
import type { ApiErrorBody } from '@/types/api'
import { tokenStorage } from './tokenStorage'

export const UNAUTHORIZED_EVENT = 'aicademy:unauthorized'

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: Record<string, string>

  constructor(status: number, code: string, message: string, details?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function newRequestId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the bearer token (PDF 3.1) and a request id (B7 observability).
http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  config.headers.set('X-Request-Id', newRequestId())
  return config
})

// Normalize every failure into an ApiError.
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      return Promise.reject(
        new ApiError(
          status,
          data?.error?.code ?? 'HTTP_ERROR',
          data?.error?.message ?? error.message,
          data?.error?.details,
        ),
      )
    }
    return Promise.reject(
      new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.'),
    )
  },
)

/** Human-readable message for any thrown value. */
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Something went wrong.'
}
