/**
 * EXTENSION: demo-only routes served by the mock layer. They do not exist in the PDF contract
 * and will NOT be implemented by the real backend. TODO(backend): remove when mocks are retired.
 */
import { http } from './http'

/** POST /api/__demo/reset: restore the seeded mock database. */
export async function resetDemoData(): Promise<void> {
  await http.post('/__demo/reset')
}
