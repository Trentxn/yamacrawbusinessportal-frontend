import client from './client'
import type { PaginatedResponse } from './types'
import type { BusinessListItem } from './businesses'

export const searchApi = {
  search(params: {
    q: string
    category?: string
    listing_type?: string
    page?: number
    page_size?: number
  }) {
    return client.get<PaginatedResponse<BusinessListItem>>('/search/', { params })
  },
}
