import client from './client'
import type { Notification, PaginatedResponse } from './types'

export const notificationsApi = {
  list(params?: { page?: number; pageSize?: number }) {
    return client.get<PaginatedResponse<Notification>>('/notifications', { params })
  },

  getUnreadCount() {
    return client.get<{ count: number }>('/notifications/unread-count')
  },

  markAsRead(id: string) {
    return client.put(`/notifications/${id}/read`)
  },

  markAllAsRead() {
    return client.put('/notifications/read-all')
  },
}
