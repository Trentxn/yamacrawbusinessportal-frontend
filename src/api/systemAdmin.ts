import client from './client'
import type { User, PaginatedResponse } from './types'

export interface AuditLog {
  id: string
  userId: string | null
  userName: string | null
  action: string
  resource: string
  resourceId: string | null
  details: string | null
  ipAddress: string | null
  timestamp: string
}

export interface SystemStats {
  totalUsers: number
  totalBusinesses: number
  dbSize: string
  uptime: string
}

export const systemAdminApi = {
  // Users
  listUsers(params?: {
    page?: number
    pageSize?: number
    role?: string
    status?: string
    search?: string
  }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<User>>('/system-admin/users/', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  getUser(id: string) {
    return client.get<User>(`/system-admin/users/${id}`)
  },

  updateUser(id: string, data: { role?: string; status?: string }) {
    return client.put<User>(`/system-admin/users/${id}`, data)
  },

  createAdminUser(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'admin' | 'system_admin'
  }) {
    return client.post<User>('/system-admin/users/', data)
  },

  // Audit logs
  listAuditLogs(params?: {
    page?: number
    pageSize?: number
    action?: string
    userId?: string
    resource?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<AuditLog>>('/system-admin/audit-logs/', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  exportAuditLogs(params?: {
    action?: string
    userId?: string
    resource?: string
    dateFrom?: string
    dateTo?: string
  }) {
    return client.get('/system-admin/audit-logs/export', {
      params,
      responseType: 'blob',
    })
  },

  // Stats
  getStats() {
    return client.get<SystemStats>('/system-admin/stats')
  },
}
