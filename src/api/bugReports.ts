import client from './client'
import type { PaginatedResponse } from './types'

export interface BugReport {
  id: string
  userId: string | null
  userEmail: string
  userName: string
  subject: string
  description: string
  pageUrl: string | null
  userAgent: string | null
  status: string
  resolvedBy: string | null
  resolverName: string | null
  resolutionNote: string | null
  resolvedAt: string | null
  createdAt: string
}

export const bugReportsApi = {
  create(data: { subject: string; description: string; pageUrl?: string }) {
    return client.post<BugReport>('/bug-reports', data)
  },

  list(params?: { status?: string; page?: number; pageSize?: number }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<BugReport>>('/bug-reports', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  update(id: string, data: { status: string; resolutionNote?: string }) {
    return client.put<BugReport>(`/bug-reports/${id}`, data)
  },
}
