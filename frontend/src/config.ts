/** Runtime configuration from Vite env variables (names documented in /frontend/.env.example). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * Mocks are disabled by default so the application connects to the real Express API + MongoDB Atlas.
 * Set VITE_USE_MOCKS='true' only if you explicitly want offline MSW mocking.
 */
export const USE_MOCKS: boolean = import.meta.env.VITE_USE_MOCKS === 'true'
