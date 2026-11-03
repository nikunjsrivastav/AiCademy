import type { Response } from 'express'
import { db } from '../models/db.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'

export async function listNotifications(req: AuthenticatedRequest, res: Response) {
  const notifs = Array.from(db.notifications.values()).filter((n) => n.userId === req.user!.id)
  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return res.json(notifs)
}

export async function markAllRead(req: AuthenticatedRequest, res: Response) {
  for (const notif of db.notifications.values()) {
    if (notif.userId === req.user!.id) {
      notif.read = true
    }
  }
  return res.json({ success: true })
}

export async function markRead(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params
  const notif = db.notifications.get(id)
  if (notif && notif.userId === req.user!.id) {
    notif.read = true
  }
  return res.json({ success: true })
}

