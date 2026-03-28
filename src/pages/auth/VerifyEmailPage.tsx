import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import { authApi } from '@/api/auth'
import type { AxiosError } from 'axios'

const resendSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type ResendForm = z.infer<typeof resendSchema>

type VerifyState = 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'error')
  const [errorMessage, setErrorMessage] = useState(
    token ? '' : 'No verification token provided. Please check your email for the correct link.'
  )
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResendForm>({
    resolver: zodResolver(resendSchema),
  })

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function verify() {
      try {
        await authApi.verifyEmail(token!)
        if (!cancelled) setState('success')
      } catch (err) {
        if (cancelled) return
        const axiosErr = err as AxiosError<{ message?: string }>
        setState('error')
        setErrorMessage(
          axiosErr.response?.data?.message ||
            'Verification failed. The link may have expired or already been used.'
        )
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [token])

  const onResend = async (data: ResendForm) => {
    setResendError('')
    setResendSuccess(false)
    try {
      await authApi.resendVerification(data.email)
      setResendSuccess(true)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      setResendError(
        axiosErr.response?.data?.message || 'Failed to resend verification email. Please try again.'
      )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-center"
    >
      {state === 'loading' && (
        <>
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-600" />
          <h2 className="mt-4 text-2xl font-bold text-surface-900">Verifying your email</h2>
          <p className="mt-2 text-sm text-surface-500">Please wait a moment...</p>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900">Email verified!</h2>
          <p className="mt-2 text-sm text-surface-500">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Continue to Sign in
          </Link>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-surface-900">Verification failed</h2>
          <p className="mt-2 text-sm text-surface-500">{errorMessage}</p>

          <div className="mt-6 border-t border-surface-200 pt-6">
            <p className="mb-3 text-sm font-medium text-surface-700">
              Resend verification email
            </p>

            {resendSuccess ? (
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-600">
                Verification email sent! Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleSubmit(onResend)} className="space-y-3">
                {resendError && (
                  <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                    {resendError}
                  </div>
                )}
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full rounded-lg border border-surface-300 py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-left text-sm text-red-600">{errors.email.message}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Sending...' : 'Resend email'}
                </button>
              </form>
            )}
          </div>

          <Link
            to="/login"
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Back to Sign in
          </Link>
        </>
      )}
    </motion.div>
  )
}
