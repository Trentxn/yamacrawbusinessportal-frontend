import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { User, Lock, Save, Mail, Phone, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/api/auth'
import type { AxiosError } from 'axios'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Banner {
  type: 'success' | 'error'
  message: string
}

function InlineBanner({ banner, onDismiss }: { banner: Banner; onDismiss: () => void }) {
  const isSuccess = banner.type === 'success'
  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm ${
        isSuccess
          ? 'bg-green-50 text-green-800 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      )}
      <span className="flex-1">{banner.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className={`shrink-0 font-medium hover:underline text-xs ${
          isSuccess ? 'text-green-700' : 'text-red-600'
        }`}
      >
        Dismiss
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Profile section
// ---------------------------------------------------------------------------

function ProfileSection() {
  const queryClient = useQueryClient()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe().then(r => r.data),
  })

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [banner, setBanner] = useState<Banner | null>(null)

  // Populate fields once the user data arrives
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setPhone(user.phone ?? '')
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: () =>
      authApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setBanner({ type: 'success', message: 'Profile updated successfully.' })
    },
    onError: (err: AxiosError<{ message?: string; detail?: string }>) => {
      setBanner({
        type: 'error',
        message: err.response?.data?.detail ?? err.response?.data?.message ?? 'Failed to update profile. Please try again.',
      })
    },
  })

  const isDirty =
    user &&
    (firstName.trim() !== user.firstName ||
      lastName.trim() !== user.lastName ||
      (phone.trim() || null) !== user.phone)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)
    if (!firstName.trim() || !lastName.trim()) {
      setBanner({ type: 'error', message: 'First name and last name are required.' })
      return
    }
    mutation.mutate()
  }

  return (
    <section className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-100 bg-surface-50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
          <User className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-surface-900">Profile Information</h2>
          <p className="text-xs text-surface-500">Update your name and contact details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
        {banner && <InlineBanner banner={banner} onDismiss={() => setBanner(null)} />}

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-11 rounded-lg bg-surface-100 animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Could not load your profile. Please refresh the page.
          </div>
        )}

        {user && (
          <>
            {/* Email — read-only */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="email"
                  readOnly
                  value={user.email}
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm text-surface-500 cursor-default select-none"
                />
              </div>
              <p className="mt-1 text-xs text-surface-400">Email cannot be changed</p>
            </div>

            {/* First / Last name row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-surface-700">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-lg border border-surface-300 py-2.5 px-3.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-surface-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-lg border border-surface-300 py-2.5 px-3.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-surface-700">
                Phone <span className="text-surface-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (242) 555-0100"
                  className="w-full rounded-lg border border-surface-300 py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={mutation.isPending || !isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {mutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Change password section
// ---------------------------------------------------------------------------

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)
  const [validationError, setValidationError] = useState('')

  const mutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setBanner({ type: 'success', message: 'Password changed successfully.' })
    },
    onError: (err: AxiosError<{ message?: string; detail?: string }>) => {
      setBanner({
        type: 'error',
        message: err.response?.data?.detail ?? err.response?.data?.message ?? 'Failed to change password. Please try again.',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBanner(null)
    setValidationError('')

    if (!currentPassword) {
      setValidationError('Current password is required.')
      return
    }
    if (newPassword.length < 8) {
      setValidationError('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setValidationError('New passwords do not match.')
      return
    }
    if (currentPassword === newPassword) {
      setValidationError('New password must differ from your current password.')
      return
    }

    mutation.mutate()
  }

  const isReady = currentPassword && newPassword && confirmPassword

  return (
    <section className="bg-white rounded-xl border border-surface-200 shadow-card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-100 bg-surface-50">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-700">
          <Lock className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-surface-900">Change Password</h2>
          <p className="text-xs text-surface-500">Keep your account secure with a strong password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
        {banner && <InlineBanner banner={banner} onDismiss={() => setBanner(null)} />}
        {validationError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Current password */}
        <div>
          <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-surface-700">
            Current password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="currentPassword"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your current password"
              className="w-full rounded-lg border border-surface-300 py-2.5 pl-10 pr-10 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-surface-700">
            New password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-surface-300 py-2.5 pl-10 pr-10 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowNew(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="mt-1 text-xs text-amber-600">Must be at least 8 characters</p>
          )}
        </div>

        {/* Confirm new password */}
        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-surface-700">
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              className="w-full rounded-lg border border-surface-300 py-2.5 pl-10 pr-10 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
          )}
          {confirmPassword.length > 0 && newPassword === confirmPassword && newPassword.length >= 8 && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Passwords match
            </p>
          )}
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending || !isReady}
            className="inline-flex items-center gap-2 rounded-lg bg-surface-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-surface-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {mutation.isPending ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfileSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-2xl mx-auto py-10 px-6"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Account Settings</h1>
        <p className="mt-1 text-sm text-surface-500">Manage your profile and security preferences</p>
      </div>

      <div className="space-y-6">
        <ProfileSection />
        <ChangePasswordSection />
      </div>
    </motion.div>
  )
}
