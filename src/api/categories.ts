import client from './client'
import type { Category } from './types'

export const categoriesApi = {
  list() {
    return client.get<Category[]>('/categories/')
  },

  getBySlug(slug: string) {
    return client.get<Category>(`/categories/${slug}`)
  },
}
