import client from './client'
import type { Business, AdminStats, PaginatedResponse, Category } from './types'
import type { BusinessListItem } from './businesses'

export interface ModerationFlag {
  id: string
  flaggedBy: string | null
  flaggedByName: string | null
  targetType: string
  targetId: string
  reason: string
  actionTaken: string | null
  resolvedBy: string | null
  resolvedByName: string | null
  resolvedAt: string | null
  resolutionNote: string | null
  createdAt: string
}

export const adminApi = {
  // Stats
  getStats() {
    return client.get<AdminStats>('/admin/stats')
  },

  // Moderation
  listPending(params?: { page?: number; pageSize?: number }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<BusinessListItem>>('/admin/businesses/pending', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  getBusinessDetail(id: string) {
    return client.get<Business>(`/admin/businesses/${id}`)
  },

  approveBusiness(id: string) {
    return client.put(`/admin/businesses/${id}/approve`)
  },

  rejectBusiness(id: string, reason: string) {
    return client.put(`/admin/businesses/${id}/reject`, { reason })
  },

  suspendBusiness(id: string, reason: string) {
    return client.put(`/admin/businesses/${id}/suspend`, { reason })
  },

  unsuspendBusiness(id: string) {
    return client.post(`/admin/businesses/${id}/unsuspend`)
  },

  featureBusiness(id: string, featured: boolean) {
    return client.put(`/admin/businesses/${id}/feature`, { isFeatured: featured })
  },

  // All businesses
  listAllBusinesses(params?: {
    status?: string
    category?: string
    page?: number
    pageSize?: number
  }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<BusinessListItem>>('/admin/businesses', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  // Users (admin-level: can only change roles between public_user and business_owner)
  listUsers(params?: {
    page?: number
    pageSize?: number
    role?: string
    status?: string
  }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<import('./types').User>>('/admin/users', {
      params: {
        ...rest,
        ...(pageSize !== undefined && { page_size: pageSize }),
      },
    })
  },

  updateUserRole(id: string, data: { role: string }) {
    return client.put<import('./types').User>(`/admin/users/${id}/role`, data)
  },

  // Categories
  listCategories() {
    return client.get<Category[]>('/categories/')
  },

  createCategory(data: { name: string; description?: string; icon?: string; sortOrder?: number }) {
    return client.post<Category>('/admin/categories', data)
  },

  updateCategory(id: string, data: { name?: string; description?: string; icon?: string; sortOrder?: number; isActive?: boolean }) {
    return client.put<Category>(`/admin/categories/${id}`, data)
  },

  deleteCategory(id: string) {
    return client.delete(`/admin/categories/${id}`)
  },

  // Flags
  listFlags(params?: { page?: number; pageSize?: number }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<ModerationFlag>>('/admin/flags', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  resolveFlag(id: string, data: { actionTaken: string; resolutionNote?: string }) {
    return client.put(`/admin/flags/${id}/resolve`, data)
  },

  // Service requests
  listAllInquiries(params?: { page?: number; pageSize?: number; status?: string }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<import('./types').ServiceRequest>>('/admin/service-requests', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  // Reviews
  listReviews(params?: { page?: number; pageSize?: number; status?: string; businessId?: string }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<import('./reviews').AdminReview>>('/admin/reviews', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  flagReview(id: string, reason: string) {
    return client.put(`/admin/reviews/${id}/flag`, { reason })
  },

  deleteReview(id: string) {
    return client.delete(`/admin/reviews/${id}`)
  },
}
