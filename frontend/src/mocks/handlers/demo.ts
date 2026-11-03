/** EXTENSION: demo-only routes (not part of the real API). TODO(backend): delete with the mock layer. */
import { http, HttpResponse } from 'msw'
import { resetDb } from '../db/store'
import { api, latency } from './utils'

export const demoHandlers = [
  http.post(api('/__demo/reset'), async () => {
    await latency()
    resetDb()
    return HttpResponse.json({ ok: true })
  }),
]
