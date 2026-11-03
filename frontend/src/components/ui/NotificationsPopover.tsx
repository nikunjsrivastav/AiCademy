/**
 * EXTENSION: In-App Notifications Popover (Decision D7, Milestone 8).
 */
import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications'
import type { Notification } from '@/types/domain'
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react'

export const NotificationsPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const fetchNotifs = async () => {
    try {
      setLoading(true)
      const data = await listNotifications()
      setNotifications(data)
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifs()
  }, [])

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifs()
        }}
        className="relative w-9 h-9 rounded-[8px] border border-mist bg-white dark:bg-slate-900 hover:bg-chalk text-ink flex items-center justify-center transition-colors cursor-pointer"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[12px] bg-white dark:bg-slate-900 border border-mist shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3 border-b border-mist flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-[4px] bg-accent-soft text-accent text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-medium text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-mist text-xs">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n.id)}
                  className={`p-3.5 transition-colors cursor-pointer ${
                    !n.read ? 'bg-accent-soft/30 hover:bg-accent-soft/50' : 'hover:bg-chalk'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-bold ${!n.read ? 'text-accent' : 'text-ink'}`}>
                      {n.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  {n.link && (
                    <Link
                      to={n.link}
                      onClick={() => setIsOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] text-accent font-semibold mt-1 hover:underline"
                    >
                      View details <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
