import client from './client'
import type { AuthResponse, User } from './types'

export const authApi = {
  login(email: string, password: string) {
    return client.post<AuthResponse>('/auth/login', { email, password })
  },

  register(data: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'public_user' | 'business_owner'
    tosAccepted: boolean
  }) {
    return client.post('/auth/register', data)
  },

  logout() {
    return client.post('/auth/logout')
  },

  refresh(refreshToken: string) {
    return client.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    })
  },

  verifyEmail(token: string) {
    return client.post('/auth/verify-email', { token })
  },

  forgotPassword(email: string, captchaToken?: string) {
    return client.post('/auth/forgot-password', { email, captchaToken })
  },

  resetPassword(token: string, password: string) {
    return client.post('/auth/reset-password', { token, password })
  },

  resendVerification(email: string) {
    return client.post('/auth/resend-verification', { email })
  },

  getMe() {
    return client.get<User>('/users/me/profile')
  },

  updateProfile(data: { firstName?: string; lastName?: string; phone?: string | null }) {
    return client.put<User>('/users/me/profile', data)
  },

  changePassword(currentPassword: string, newPassword: string) {
    return client.put('/users/me/password', { currentPassword, newPassword })
  },

  acceptTos(tosVersion: string) {
    return client.post('/auth/accept-tos', { tosVersion })
  },
}
