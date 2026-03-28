import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  ExternalLink,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Tag,
  Briefcase,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
} from 'lucide-react'
import { businessesApi } from '@/api/businesses'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { reviewsApi } from '@/api/reviews'
import type { Review } from '@/api/reviews'
import { useAuth } from '@/contexts/AuthContext'
import TurnstileWidget from '@/components/TurnstileWidget'
import type { TurnstileWidgetRef } from '@/components/TurnstileWidget'
import type { Business } from '@/api/types'

// --- Animation variants ---

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

// --- Inquiry form schema ---

const inquirySchema = z.object({
  senderName: z.string().min(1, 'Name is required').max(100),
  senderEmail: z.string().min(1, 'Email is required').email('Enter a valid email'),
  senderPhone: z.string().max(30).optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(5000),
})

type InquiryFormData = z.infer<typeof inquirySchema>

// --- Helpers ---

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const

function getTodayName(): string {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getSocialIcon(_key: string) {
  return ExternalLink
}

// --- Skeleton ---

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 h-5 w-32 rounded bg-surface-200" />
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl bg-surface-200" />
            <div className="flex-1 space-y-3">
              <div className="h-8 w-64 rounded bg-surface-200" />
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded-full bg-surface-200" />
                <div className="h-6 w-24 rounded-full bg-surface-200" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-surface-200" />
            <div className="h-4 w-3/4 rounded bg-surface-200" />
            <div className="h-4 w-5/6 rounded bg-surface-200" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-surface-200" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-60 rounded-xl bg-surface-200" />
          <div className="h-48 rounded-xl bg-surface-200" />
        </div>
      </div>
    </div>
  )
}

// --- Not Found ---

function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-surface-900">Business Not Found</h1>
      <p className="mt-4 text-surface-500">
        The business you are looking for does not exist or has been removed.
      </p>
      <Link
        to="/directory"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>
    </div>
  )
}

// --- Inquiry Form ---

function InquiryForm({ business }: { business: Business }) {
  const { user } = useAuth()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [captchaToken, setCaptchaToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetRef>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      senderName: user ? `${user.firstName} ${user.lastName}` : '',
      senderEmail: user?.email ?? '',
      senderPhone: '',
      subject: '',
      message: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: InquiryFormData) => {
      if (!captchaToken) {
        return Promise.reject(new Error('Please complete the CAPTCHA verification.'))
      }
      return serviceRequestsApi.create({
        businessId: business.id,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone || null,
        subject: data.subject,
        message: data.message,
        captchaToken,
      })
    },
    onSuccess: () => {
      setToast({ type: 'success', message: 'Your inquiry has been sent.' })
      reset({
        senderName: user ? `${user.firstName} ${user.lastName}` : '',
        senderEmail: user?.email ?? '',
        senderPhone: '',
        subject: '',
        message: '',
      })
      turnstileRef.current?.reset()
      setCaptchaToken('')
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Failed to send inquiry. Please try again.'
      setToast({ type: 'error', message })
      turnstileRef.current?.reset()
      setCaptchaToken('')
    },
  })

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const inputClass = (hasError: boolean) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors ${
      hasError
        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
        : 'border-surface-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'
    }`

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      className="rounded-xl border border-surface-200 bg-white p-6 shadow-card"
    >
      <h3 className="mb-1 text-lg font-bold text-surface-900">Send an Inquiry</h3>
      <p className="mb-5 text-sm text-surface-500">
        Have a question for {business.name}? Fill out the form below.
      </p>

      {toast && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Name</label>
            <input {...register('senderName')} className={inputClass(!!errors.senderName)} placeholder="Your name" />
            {errors.senderName && <p className="mt-1 text-xs text-red-500">{errors.senderName.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">Email</label>
            <input {...register('senderEmail')} type="email" className={inputClass(!!errors.senderEmail)} placeholder="you@email.com" />
            {errors.senderEmail && <p className="mt-1 text-xs text-red-500">{errors.senderEmail.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Phone <span className="text-surface-400">(optional)</span>
          </label>
          <input {...register('senderPhone')} type="tel" className={inputClass(!!errors.senderPhone)} placeholder="242-555-0123" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Subject</label>
          <input {...register('subject')} className={inputClass(!!errors.subject)} placeholder="What is your inquiry about?" />
          {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">Message</label>
          <textarea
            {...register('message')}
            rows={4}
            className={inputClass(!!errors.message)}
            placeholder="Describe your question or request..."
          />
          {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message.message}</p>}
        </div>

        <TurnstileWidget
          ref={turnstileRef}
          onSuccess={setCaptchaToken}
          onError={() => setCaptchaToken('')}
          onExpire={() => setCaptchaToken('')}
        />

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {mutation.isPending ? 'Sending...' : 'Send Inquiry'}
        </button>
      </form>
    </motion.div>
  )
}

// --- Star Rating Display ---

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < Math.round(rating)
              ? 'fill-accent-400 text-accent-400'
              : 'fill-surface-300 text-surface-300'
          }`}
        />
      ))}
    </div>
  )
}

// --- Interactive Star Picker ---

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starVal = i + 1
        const active = starVal <= (hover || value)
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(starVal)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(starVal)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-7 w-7 ${
                active
                  ? 'fill-accent-400 text-accent-400'
                  : 'fill-surface-200 text-surface-300'
              }`}
            />
          </button>
        )
      })}
    </div>
  )
}

// --- Review Card ---

function ReviewCard({
  review,
  isOwn,
  onDelete,
  isDeleting,
}: {
  review: Review
  isOwn: boolean
  onDelete?: () => void
  isDeleting?: boolean
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const displayName = review.reviewer
    ? `${review.reviewer.firstName} ${review.reviewer.lastInitial}.`
    : 'Anonymous'

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface-900">{displayName}</p>
          <div className="mt-1 flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span className="text-xs text-surface-400">
              {new Date(review.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {isOwn && onDelete && (
          <div className="shrink-0">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onDelete}
                  disabled={isDeleting}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-surface-300 px-3 py-1.5 text-xs font-medium text-surface-600 transition-colors hover:bg-surface-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 rounded-lg border border-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-surface-600">{review.comment}</p>
    </div>
  )
}

// --- Reviews Section ---

function ReviewsSection({ business }: { business: Business }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [reviewPage, setReviewPage] = useState(1)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data: reviewData, isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', business.id, reviewPage],
    queryFn: () => reviewsApi.listForBusiness(business.id, reviewPage, 10).then((r) => r.data),
  })

  const { data: myReviews } = useQuery({
    queryKey: ['reviews', 'mine'],
    queryFn: () => reviewsApi.listMine().then((r) => r.data),
    enabled: !!user,
  })

  const myReviewForBusiness = myReviews?.find((r) => r.businessId === business.id)

  const createMutation = useMutation({
    mutationFn: () => reviewsApi.create({ businessId: business.id, rating, comment }),
    onSuccess: () => {
      setToast({ type: 'success', message: 'Review submitted! It will appear after approval.' })
      setRating(0)
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Failed to submit review.'
      if (msg.toLowerCase().includes('already'))
        setToast({ type: 'error', message: 'You have already reviewed this business.' })
      else if (msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('daily'))
        setToast({ type: 'error', message: 'Daily review limit reached (2 per day). Try again tomorrow.' })
      else setToast({ type: 'error', message: msg })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => reviewsApi.deleteMine(reviewId),
    onSuccess: () => {
      setToast({ type: 'success', message: 'Your review has been deleted.' })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
    onError: () => {
      setToast({ type: 'error', message: 'Failed to delete review.' })
    },
  })

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const canSubmit = rating >= 1 && comment.trim().length >= 10 && !createMutation.isPending
  const totalPages = reviewData ? Math.ceil(reviewData.total / 10) : 1

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={fadeUp}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-bold text-surface-900">Reviews</h2>

        {/* Average rating */}
        {reviewData && reviewData.total > 0 && (
          <div className="mt-3 flex items-center gap-4">
            <span className="text-4xl font-extrabold text-surface-900">
              {reviewData.averageRating?.toFixed(1)}
            </span>
            <div>
              <StarRating rating={reviewData.averageRating ?? 0} size="lg" />
              <p className="mt-0.5 text-sm text-surface-500">
                {reviewData.total} {reviewData.total === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* User's own review */}
      {myReviewForBusiness && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-400">Your Review</p>
          <ReviewCard
            review={myReviewForBusiness}
            isOwn
            onDelete={() => deleteMutation.mutate(myReviewForBusiness.id)}
            isDeleting={deleteMutation.isPending}
          />
        </div>
      )}

      {/* Submit review form */}
      {user && !myReviewForBusiness && (
        <div className="rounded-xl border border-surface-200 bg-white p-5">
          <h3 className="mb-3 text-sm font-bold text-surface-900">Write a Review</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">Rating</label>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-surface-700">Comment</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience (min 10 characters)..."
                className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-500 focus:ring-1 focus:ring-primary-200"
              />
              {comment.length > 0 && comment.trim().length < 10 && (
                <p className="mt-1 text-xs text-red-500">
                  Comment must be at least 10 characters ({comment.trim().length}/10)
                </p>
              )}
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star className="h-4 w-4" />
              )}
              {createMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}

      {/* Login prompt */}
      {!user && (
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-5 text-center">
          <p className="text-sm text-surface-600">
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Log in
            </Link>{' '}
            to leave a review
          </p>
        </div>
      )}

      {/* Reviews list */}
      {reviewsLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-surface-200 bg-white p-4">
              <div className="h-4 w-24 rounded bg-surface-200" />
              <div className="mt-2 h-3 w-32 rounded bg-surface-200" />
              <div className="mt-3 h-3 w-full rounded bg-surface-200" />
              <div className="mt-1 h-3 w-3/4 rounded bg-surface-200" />
            </div>
          ))}
        </div>
      )}

      {reviewData && reviewData.items.length > 0 && (
        <div className="space-y-3">
          {reviewData.items
            .filter((r) => r.id !== myReviewForBusiness?.id)
            .map((review) => (
              <ReviewCard key={review.id} review={review} isOwn={false} />
            ))}
        </div>
      )}

      {reviewData && reviewData.total === 0 && !myReviewForBusiness && (
        <p className="py-6 text-center text-sm text-surface-500">
          No reviews yet. Be the first to share your experience!
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
            disabled={reviewPage === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 text-surface-500 transition-colors hover:bg-surface-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-surface-600">
            {reviewPage} / {totalPages}
          </span>
          <button
            onClick={() => setReviewPage((p) => Math.min(totalPages, p + 1))}
            disabled={reviewPage === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 text-surface-500 transition-colors hover:bg-surface-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// --- Main Page ---

// --- Report Button ---

function ReportButton({ business }: { business: Business }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const reportMutation = useMutation({
    mutationFn: () => businessesApi.reportBusiness(business.id, reason),
    onSuccess: () => {
      setOpen(false)
      setReason('')
      setToast({ type: 'success', message: 'Thank you. Your report has been submitted for review.' })
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Failed to submit report.'
      setToast({ type: 'error', message: msg })
    },
  })

  if (!user) return null

  return (
    <>
      {toast && (
        <div
          className={`mb-3 rounded-lg border px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}
      <motion.div variants={fadeUp}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 text-sm text-surface-400 hover:text-red-500 transition-colors"
        >
          <Flag className="h-4 w-4" />
          Report this listing
        </button>
      </motion.div>

      {/* Report Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-surface-900">Report Listing</h3>
                <p className="text-sm text-surface-500">Report "{business.name}"</p>
              </div>
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe why you are reporting this listing..."
              rows={4}
              className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => { setOpen(false); setReason('') }}
                className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => reportMutation.mutate()}
                disabled={!reason.trim() || reportMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {reportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function BusinessDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()

  const {
    data: business,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['business', slug],
    queryFn: () => businessesApi.getBySlug(slug!).then((r) => r.data),
    enabled: !!slug,
  })

  if (isLoading) return <DetailSkeleton />
  if (isError || !business) return <NotFound />

  const todayName = getTodayName()
  const hours = business.operatingHours
  const hasPhotos = business.photos && business.photos.length > 0
  const hasSocials = business.socialLinks && Object.keys(business.socialLinks).length > 0

  return (
    <div className="bg-white pb-20">
      {/* Back link */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          to="/directory"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 transition-colors hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Directory
        </Link>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
      >
        <div className="grid gap-10 lg:grid-cols-3">
          {/* --- Main Column --- */}
          <div className="space-y-8 lg:col-span-2">
            {/* Header */}
            <motion.div variants={fadeUp} className="flex items-start gap-5">
              {/* Logo / Initials */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 shadow-sm">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-primary-400">
                    {getInitials(business.name)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-surface-900 sm:text-4xl">
                  {business.name}
                </h1>

                {/* Badges */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {business.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
                      <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                      Featured
                    </span>
                  )}
                  {business.category && (
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600">
                      {business.category.name}
                    </span>
                  )}
                  {(business as Business & { listingType?: string }).listingType === 'contractor' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                      <Briefcase className="h-3 w-3" />
                      Contractor
                    </span>
                  )}
                </div>

                {/* Short description */}
                {business.shortDescription && (
                  <p className="mt-3 text-base leading-relaxed text-surface-600">
                    {business.shortDescription}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Full description */}
            {business.description && (
              <motion.div variants={fadeUp}>
                <h2 className="mb-3 text-lg font-bold text-surface-900">About</h2>
                <div className="whitespace-pre-line text-sm leading-relaxed text-surface-600">
                  {business.description}
                </div>
              </motion.div>
            )}

            {/* Photo Gallery */}
            {hasPhotos && (
              <motion.div variants={fadeUp}>
                <h2 className="mb-3 text-lg font-bold text-surface-900">Photos</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {business.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-surface-200 bg-surface-100"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || business.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-6">
                          <p className="text-xs text-white">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tags */}
            {business.tags && business.tags.length > 0 && (
              <motion.div variants={fadeUp}>
                <h2 className="mb-3 text-lg font-bold text-surface-900">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {business.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-medium text-surface-700"
                    >
                      <Tag className="h-3 w-3 text-surface-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inquiry Form - hidden for admin/system_admin roles */}
            {(!user || (user.role !== 'admin' && user.role !== 'system_admin')) && (
              <InquiryForm business={business} />
            )}

            {/* Reviews */}
            <ReviewsSection business={business} />
          </div>

          {/* --- Sidebar --- */}
          <div className="space-y-6">
            {/* Contact Card */}
            <motion.div
              variants={fadeUp}
              className="rounded-xl border border-surface-200 bg-white p-6 shadow-card"
            >
              <h3 className="mb-4 text-lg font-bold text-surface-900">Contact & Details</h3>
              <div className="space-y-3.5">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-3 text-sm text-surface-700 transition-colors hover:text-primary-600"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-surface-400" />
                    {business.phone}
                  </a>
                )}
                {business.email && (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-3 text-sm text-surface-700 transition-colors hover:text-primary-600"
                  >
                    <Mail className="h-4 w-4 shrink-0 text-surface-400" />
                    {business.email}
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-surface-700 transition-colors hover:text-primary-600"
                  >
                    <Globe className="h-4 w-4 shrink-0 text-surface-400" />
                    <span className="truncate">{business.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-surface-400" />
                  </a>
                )}
                {(business.addressLine1 || business.settlement) && (
                  <div className="flex items-start gap-3 text-sm text-surface-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-surface-400" />
                    <div>
                      {business.addressLine1 && <div>{business.addressLine1}</div>}
                      {business.addressLine2 && <div>{business.addressLine2}</div>}
                      {business.settlement && <div>{business.settlement}</div>}
                      <div>{business.island}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {hasSocials && (
                <div className="mt-5 border-t border-surface-100 pt-4">
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Follow
                  </p>
                  <div className="flex gap-2">
                    {Object.entries(business.socialLinks!).map(([platform, url]) => {
                      const Icon = getSocialIcon(platform)
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-200 text-surface-500 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                          title={platform}
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Operating Hours */}
            {hours && Object.keys(hours).length > 0 && (
              <motion.div
                variants={fadeUp}
                className="rounded-xl border border-surface-200 bg-white p-6 shadow-card"
              >
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-surface-900">
                  <Clock className="h-4 w-4 text-surface-400" />
                  Hours
                </h3>
                <ul className="space-y-2">
                  {DAYS.map((day) => {
                    const dayHours = hours[day] ?? hours[day.toLowerCase()] ?? null
                    const isToday = day === todayName

                    return (
                      <li
                        key={day}
                        className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
                          isToday ? 'bg-primary-50 font-semibold text-primary-800' : 'text-surface-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {day}
                          {isToday && (
                            <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                              Today
                            </span>
                          )}
                        </span>
                        <span>
                          {!dayHours || typeof dayHours === 'string' ? 'Closed' : `${dayHours.open} - ${dayHours.close}`}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            )}
            {/* Report Button */}
            <ReportButton business={business} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
