import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { notificationsApi } from '@/api/notifications'
import type { Notification } from '@/api/types'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => r.data.count),
    refetchInterval: 30_000,
  })

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsApi.list({ page: 1, pageSize: 8 }).then((r) => r.data),
    enabled: open,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = countData ?? 0
  const notifications: Notification[] = notifData?.items ?? []

  function handleClick(notif: Notification) {
    if (!notif.isRead) markReadMutation.mutate(notif.id)
    setOpen(false)
    if (notif.link) navigate(notif.link)
  }

  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 320 // w-80
      const screenWidth = window.innerWidth
      const rightOffset = screenWidth - rect.right

      // On mobile, if the dropdown would overflow, pin it with margin
      const safeRight = Math.max(8, Math.min(rightOffset, screenWidth - dropdownWidth - 8))

      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: safeRight,
        zIndex: 9999,
        maxWidth: `calc(100vw - 1rem)`,
      })
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-surface-500 hover:bg-surface-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={dropdownStyle} className="w-80 rounded-xl border border-surface-200 bg-white shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
            <span className="text-sm font-semibold text-surface-800">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-surface-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="h-8 w-8 text-surface-300 mx-auto mb-2" />
                <p className="text-sm text-surface-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-surface-50 hover:bg-surface-50 transition-colors ${
                    !notif.isRead ? 'bg-primary-50/40' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.isRead && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                    )}
                    <div className={!notif.isRead ? '' : 'pl-4'}>
                      <p className="text-sm font-medium text-surface-800 leading-snug">
                        {notif.title}
                      </p>
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-surface-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
