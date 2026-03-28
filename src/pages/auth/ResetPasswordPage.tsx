import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Lock, Check, X, CheckCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import type { AxiosError } from 'axios'

const passwordRequirements = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'One digit', test: (v: string) => /\d/.test(v) },
  { label: 'One special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/\d/, 'Must contain a digit')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState(
    token ? '' : 'Invalid reset link. Please request a new password reset.'
  )
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const passwordValue = watch('password') || ''

  const onSubmit = async (data: ResetForm) => {
    if (!token) return
    setServerError('')
    try {
      await authApi.resetPassword(token, data.password)
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 3000)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; detail?: string }>
      setServerError(
        axiosErr.response?.data?.detail ||
          axiosErr.response?.data?.message ||
          'Password reset failed. The link may have expired. Please request a new one.'
      )
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900">Password reset successfully</h2>
        <p className="mt-2 text-sm text-surface-500">
          Your password has been updated. Redirecting you to sign in...
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
        >
          Sign in now
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-surface-900">Reset your password</h2>
        <p className="mt-1 text-sm text-surface-500">Enter your new password below</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {!token ? (
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-surface-700"
            >
              New password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter new password"
                className="w-full rounded-lg border border-surface-300 py-3 pl-10 pr-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Password requirements checklist */}
            {passwordValue.length > 0 && (
              <ul className="mt-2 space-y-1">
                {passwordRequirements.map((req) => {
                  const passes = req.test(passwordValue)
                  return (
                    <li key={req.label} className="flex items-center gap-1.5 text-xs">
                      {passes ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-surface-300" />
                      )}
                      <span className={passes ? 'text-green-600' : 'text-surface-400'}>
                        {req.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-surface-700"
            >
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-surface-300 py-3 pl-10 pr-10 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Back to Sign in
        </Link>
      </p>
    </motion.div>
  )
}
