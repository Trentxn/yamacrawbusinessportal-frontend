export type UserRole = 'system_admin' | 'admin' | 'business_owner' | 'contractor' | 'public_user'
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification'
export type BusinessStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'suspended' | 'archived'
export type ListingType = 'business' | 'contractor'
export type ServiceRequestStatus = 'open' | 'read' | 'replied' | 'closed' | 'spam'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  avatarUrl: string | null
  createdAt: string
  lastLogin: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sortOrder: number
  businessCount?: number
}

export interface Business {
  id: string
  ownerId: string
  categoryId: string
  category?: Category
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  phone: string | null
  email: string | null
  website: string | null
  addressLine1: string | null
  addressLine2: string | null
  island: string
  settlement: string | null
  logoUrl: string | null
  status: BusinessStatus
  rejectionReason: string | null
  operatingHours: Record<string, { open: string; close: string } | string | null> | null
  socialLinks: Record<string, string> | null
  isFeatured: boolean
  tags: string[]
  photos: BusinessPhoto[]
  viewCount?: number
  createdAt: string
  updatedAt: string
}

export interface BusinessPhoto {
  id: string
  url: string
  caption: string | null
  sortOrder: number
}

export interface InquiryMessage {
  id: string
  senderId: string | null
  senderRole: string
  senderName: string
  body: string
  createdAt: string
}

export interface ServiceRequest {
  id: string
  businessId: string
  businessName: string | null
  businessStatus: string | null
  userId: string | null
  senderAccountStatus: string | null
  senderName: string
  senderEmail: string
  senderPhone: string | null
  subject: string
  message: string
  status: ServiceRequestStatus
  ownerReply: string | null
  repliedAt: string | null
  closedBy: string | null
  closedByRole: string | null
  closedByName: string | null
  closeReason: string | null
  closedAt: string | null
  reopenedBy: string | null
  reopenedByName: string | null
  reopenedAt: string | null
  reopenCount: number
  expiresAt: string | null
  createdAt: string
  messages: InquiryMessage[]
}

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AdminStats {
  totalBusinesses: number
  pendingApprovals: number
  totalUsers: number
  totalInquiries: number
  inquiriesThisMonth: number
  topCategories: Array<{ name: string; count: number }>
}
