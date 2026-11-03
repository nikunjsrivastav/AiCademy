/**
 * MSW Handlers for Notifications routes (Decision D7).
 */
import { http, HttpResponse } from 'msw'
import { api, authenticate, errorResponse, latency } from './utils'
import { getDb, saveDb } from '../db/store'

export const notificationHandlers = [
  // GET /api/notifications
  http.get(api('/notifications'), async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(30, 80)

    const db = getDb()
    const userNotifs = db.notifications.filter((n) => n.userId === auth.user.id)
    return HttpResponse.json(userNotifs)
  }),

  // POST /api/notifications/:id/read
  http.post(api('/notifications/:id/read'), async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(30, 60)

    const { id } = params
    const db = getDb()
    const notif = db.notifications.find((n) => n.id === id)
    if (!notif) {
      return errorResponse(404, 'NOT_FOUND', `Notification ${id} not found`)
    }

    if (notif.userId !== auth.user.id) {
      return errorResponse(403, 'FORBIDDEN', 'Access denied')
    }

    notif.read = true
    saveDb()
    return HttpResponse.json({ success: true })
  }),

  // POST /api/notifications/read-all
  http.post(api('/notifications/read-all'), async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    await latency(30, 60)

    const db = getDb()
    db.notifications
      .filter((n) => n.userId === auth.user.id)
      .forEach((n) => {
        n.read = true
      })

    saveDb()
    return HttpResponse.json({ success: true })
  }),
]
