/** Access-token persistence. TODO(backend): consider httpOnly refresh cookies in Phase 1. */
const KEY = 'aicademy.token'

export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set(token: string): void {
    localStorage.setItem(KEY, token)
  },
  clear(): void {
    localStorage.removeItem(KEY)
  },
}
