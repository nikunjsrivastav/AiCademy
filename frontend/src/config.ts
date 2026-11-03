/** Runtime configuration from Vite env variables (names documented in /frontend/.env.example). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api'

/** Mocks default to ON unless explicitly disabled. TODO(backend): set VITE_USE_MOCKS=false in Phase 1. */
export const USE_MOCKS: boolean = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false'
