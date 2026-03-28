import client from './client'
import type { Business, BusinessPhoto, ListingType, PaginatedResponse } from './types'

export interface BusinessListItem {
  id: string
  name: string
  slug: string
  shortDescription: string | null
  category: string | null
  logoUrl: string | null
  listingType: ListingType
  isFeatured: boolean
  status: string
  averageRating: number | null
  reviewCount: number
}

export interface BusinessCreateData {
  name: string
  categoryId: string
  shortDescription: string
  description: string
  phone?: string | null
  email?: string | null
  website?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  island?: string
  settlement?: string | null
  operatingHours?: Record<string, { open: string; close: string } | string | null> | null
  socialLinks?: Record<string, string> | null
  tags?: string[]
  logoUrl?: string | null
}

export type BusinessUpdateData = Partial<BusinessCreateData>

export const businessesApi = {
  list(params?: {
    category?: string
    tags?: string[]
    page?: number
    pageSize?: number
    featured?: boolean
    listingType?: ListingType
  }) {
    const { listingType, pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<BusinessListItem>>('/businesses', {
      params: {
        ...rest,
        ...(pageSize !== undefined && { page_size: pageSize }),
        ...(listingType !== undefined && { listing_type: listingType }),
      },
    })
  },

  getBySlug(slug: string) {
    return client.get<Business>(`/businesses/${slug}`)
  },

  getOwnById(id: string) {
    return client.get<Business>(`/businesses/mine/${id}`)
  },

  getMine() {
    return client.get<BusinessListItem[]>('/businesses/mine')
  },

  create(data: BusinessCreateData) {
    return client.post<Business>('/businesses', data)
  },

  update(id: string, data: BusinessUpdateData) {
    return client.put<Business>(`/businesses/${id}`, data)
  },

  submitForReview(id: string) {
    return client.post<Business>(`/businesses/${id}/submit`)
  },

  archive(id: string) {
    return client.post<Business>(`/businesses/${id}/archive`)
  },

  reactivate(id: string) {
    return client.post<Business>(`/businesses/${id}/reactivate`)
  },

  addPhoto(businessId: string, data: { url: string; caption?: string | null }) {
    return client.post<BusinessPhoto>(`/businesses/${businessId}/photos`, data)
  },

  removePhoto(businessId: string, photoId: string) {
    return client.delete(`/businesses/${businessId}/photos/${photoId}`)
  },

  reorderPhotos(businessId: string, photoIds: string[]) {
    return client.put(`/businesses/${businessId}/photos/reorder`, { photoIds })
  },

  reportBusiness(businessId: string, reason: string) {
    return client.post(`/businesses/${businessId}/report`, { reason })
  },
}
