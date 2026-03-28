import client from './client'
import type { ServiceRequest, InquiryMessage, PaginatedResponse } from './types'

export interface InquiryCreateData {
  businessId: string
  senderName: string
  senderEmail: string
  senderPhone?: string | null
  subject: string
  message: string
  captchaToken: string
}

export const serviceRequestsApi = {
  create(data: InquiryCreateData) {
    return client.post<ServiceRequest>('/service-requests', data)
  },

  // Business owner: list received inquiries
  listReceived(params?: {
    businessId?: string
    status?: string
    page?: number
    pageSize?: number
  }) {
    return client.get<PaginatedResponse<ServiceRequest>>('/service-requests/received', { params })
  },

  // Registered user: list sent inquiries
  listSent(params?: { page?: number; pageSize?: number }) {
    const { pageSize, ...rest } = params || {}
    return client.get<PaginatedResponse<ServiceRequest>>('/users/me/inquiries', {
      params: { ...rest, ...(pageSize !== undefined && { page_size: pageSize }) },
    })
  },

  getById(id: string) {
    return client.get<ServiceRequest>(`/service-requests/${id}`)
  },

  // Add a message to the conversation thread
  addMessage(id: string, body: string) {
    return client.post<InquiryMessage>(`/service-requests/${id}/messages`, { body })
  },

  // Legacy reply (still works but also adds to messages)
  reply(id: string, ownerReply: string) {
    return client.put(`/service-requests/${id}/reply`, { reply: ownerReply })
  },

  close(id: string, reason?: string) {
    return client.put(`/service-requests/${id}/close`, { reason: reason || null })
  },

  markSpam(id: string) {
    return client.put(`/service-requests/${id}/spam`)
  },

  reopen(id: string) {
    return client.put(`/service-requests/${id}/reopen`)
  },
}
