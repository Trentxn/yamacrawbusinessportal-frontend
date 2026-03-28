import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Mail, Lock, User, Check, X, Search, Store, HardHat } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import TurnstileWidget from '@/components/TurnstileWidget'
import type { TurnstileWidgetRef } from '@/components/TurnstileWidget'
import type { AxiosError } from 'axios'

const passwordRequirements = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'One digit', test: (v: string) => /\d/.test(v) },
  { label: 'One special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

const registerSchema = z
  .object({
    role: z.enum(['public_user', 'business_owner', 'contractor'], {
      error: 'Please select how you want to use the portal',
    }),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[a-z]/, 'Must contain a lowercase letter')
      .regex(/\d/, 'Must contain a digit')
      .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    tosAccepted: z.literal(true, {
      error: 'You must accept the Terms and Conditions and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: authRegister } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetRef>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {},
  })

  const selectedRole = watch('role')
  const passwordValue = watch('password') || ''

  const onSubmit = async (data: RegisterForm) => {
    setServerError('')
    if (!captchaToken) {
      setServerError('Please complete the CAPTCHA verification.')
      return
    }
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role === 'contractor' ? 'business_owner' : data.role,
        tosAccepted: data.tosAccepted,
        captchaToken,
      })
      setSuccess(true)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>
      setServerError(
        axiosErr.response?.data?.message || 'Registration failed. Please try again.'
      )
      turnstileRef.current?.reset()
      setCaptchaToken('')
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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <Mail className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900">Check your email</h2>
        <p className="mt-2 text-sm text-surface-500">
          We've sent a verification link to your email address. Please check your inbox and click
          the link to activate your account.
        </p>
        <p className="mt-4 text-sm text-surface-500">
          Already verified?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
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
        <h2 className="text-2xl font-bold text-surface-900">Create your account</h2>
        <p className="mt-1 text-sm text-surface-500">Join the Yamacraw community</p>
      </div>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Role selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-surface-700">
            I want to...
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setValue('role', 'public_user', { shouldValidate: true })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 text-sm transition-colors ${
                selectedRole === 'public_user'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              <Search className="h-5 w-5" />
              <span className="font-medium">Browse</span>
              <span className="text-xs text-surface-400">Find local businesses</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'business_owner', { shouldValidate: true })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 text-sm transition-colors ${
                selectedRole === 'business_owner'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              <Store className="h-5 w-5" />
              <span className="font-medium">List my business</span>
              <span className="text-xs text-surface-400">Get discovered</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'contractor', { shouldValidate: true })}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 px-3 py-4 text-sm transition-colors ${
                selectedRole === 'contractor'
                  ? 'border-teal-600 bg-teal-50 text-teal-700'
                  : 'border-surface-200 text-surface-600 hover:border-surface-300'
              }`}
            >
              <HardHat className="h-5 w-5" />
              <span className="font-medium">Contractor</span>
              <span className="text-xs text-surface-400">Offer your services</span>
            </button>
          </div>
          {selectedRole === 'contractor' && (
            <p className="mt-2 text-xs text-teal-600">
              As a contractor, you can create listings for your trade or professional services. Your listings will appear in the contractor directory.
            </p>
          )}
          {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-surface-700">
              First name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="John"
                className="w-full rounded-lg border border-surface-300 py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-surface-700">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Doe"
              className="w-full rounded-lg border border-surface-300 px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              {...register('lastName')}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-surface-700">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-surface-300 py-3 pl-10 pr-4 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-surface-700">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
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
            Confirm password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Re-enter your password"
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

        {/* ToS */}
        <div>
          <label className="flex items-start gap-2 text-sm text-surface-600">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
              {...register('tosAccepted')}
            />
            <span>
              I agree to the{' '}
              <Link
                to="/terms"
                className="font-medium text-primary-600 hover:text-primary-700"
                target="_blank"
              >
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="font-medium text-primary-600 hover:text-primary-700"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.tosAccepted && (
            <p className="mt-1 text-sm text-red-600">{errors.tosAccepted.message}</p>
          )}
        </div>

        {/* CAPTCHA */}
        <TurnstileWidget
          ref={turnstileRef}
          onSuccess={setCaptchaToken}
          onError={() => setCaptchaToken('')}
          onExpire={() => setCaptchaToken('')}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
