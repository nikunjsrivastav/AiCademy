/** Runtime configuration from Vite env variables (names documented in /frontend/.env.example). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Mocks are enabled in local dev by default, and disabled in production builds (talks to real Express API + MongoDB).
 * Can be explicitly overridden with VITE_USE_MOCKS='true' or 'false'.
 */
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS !== undefined
  ? import.meta.env.VITE_USE_MOCKS === 'true'
  : !import.meta.env.PROD
