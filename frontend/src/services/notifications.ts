/**
 * Notifications Service calling /api/notifications routes (Decision D7).
 */
import { http } from './http'
import type { Notification } from '@/types/domain'

export async function listNotifications(): Promise<Notification[]> {
  const res = await http.get<Notification[]>('/notifications')
  return res.data
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  const res = await http.post<{ success: boolean }>(`/notifications/${id}/read`)
  return res.data
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  const res = await http.post<{ success: boolean }>('/notifications/read-all')
  return res.data
}
