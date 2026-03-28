import client from './client'
import type { PaginatedResponse } from './types'

export interface Review {
  id: string
  businessId: string
  userId: string
  rating: number
  comment: string
  status: string
  createdAt: string
  reviewer: { firstName: string; lastInitial: string } | null
}

export interface ReviewListResponse {
  items: Review[]
  total: number
  averageRating: number | null
}

export interface AdminReview extends Review {
  updatedAt: string
  businessName: string | null
}

export const reviewsApi = {
  listForBusiness(businessId: string, page = 1, pageSize = 10) {
    return client.get<ReviewListResponse>(`/reviews/business/${businessId}`, {
      params: { page, page_size: pageSize },
    })
  },

  create(data: { businessId: string; rating: number; comment: string }) {
    return client.post<Review>('/reviews/', data)
  },

  deleteMine(reviewId: string) {
    return client.delete(`/reviews/${reviewId}`)
  },

  listMine() {
    return client.get<Review[]>('/reviews/mine')
  },

  // Business owner: reviews on my businesses
  listMyBusinessReviews(params?: { businessId?: string; page?: number; pageSize?: number }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<Review>>('/reviews/my-business-reviews', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  // Flag a review (business owner)
  flagReview(reviewId: string, reason: string) {
    return client.post(`/reviews/${reviewId}/flag`, { reason })
  },
}
