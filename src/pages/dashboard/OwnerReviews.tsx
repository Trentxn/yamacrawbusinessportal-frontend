import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Star, Flag, AlertTriangle, MessageSquare, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { reviewsApi } from '@/api/reviews'
import { businessesApi } from '@/api/businesses'

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

const STATUS_BADGE: Record<string, string> = {
  approved:  'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  pending:   'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  flagged:   'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
  removed:   'bg-surface-100 text-surface-500 ring-1 ring-inset ring-surface-200',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? 'fill-accent-500 text-accent-500'
              : 'text-surface-200'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface Toast {
  id: number
  type: 'success' | 'error'
  message: string
}

let toastId = 0

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          className={`flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-elevated ${
            t.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {t.message}
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-2 text-white/70 hover:text-white transition-colors"
          >
            &times;
          </button>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-surface-100 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-28 bg-surface-100 rounded" />
          <div className="mt-2 h-3 w-20 bg-surface-100 rounded" />
        </div>
        <div className="h-5 w-16 bg-surface-100 rounded-full" />
      </div>
      <div className="mt-4 h-4 w-full bg-surface-100 rounded" />
      <div className="mt-2 h-4 w-3/4 bg-surface-100 rounded" />
      <div className="mt-4 flex items-center justify-between">
        <div className="h-3 w-24 bg-surface-100 rounded" />
        <div className="h-8 w-20 bg-surface-100 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Flag Modal ──────────────────────────────────────────────────────────────

function FlagModal({
  reviewId,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  reviewId: string
  onClose: () => void
  onSubmit: (id: string, reason: string) => void
  isSubmitting: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-elevated"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <Flag className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900">Flag Review</h3>
            <p className="text-xs text-surface-500">Report this review for administrator review</p>
          </div>
        </div>

        <label htmlFor="flag-reason" className="block text-sm font-medium text-surface-700 mb-1.5">
          Reason
        </label>
        <textarea
          id="flag-reason"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe why this review is unfair or violates guidelines..."
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 transition-colors resize-none"
        />

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-surface-200 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(reviewId, reason)}
            disabled={!reason.trim() || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Flag Review
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function OwnerReviews() {
  const queryClient = useQueryClient()
  const [businessFilter, setBusinessFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [flagTarget, setFlagTarget] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  function pushToast(type: 'success' | 'error', message: string) {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }

  function dismissToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Fetch owner's businesses for filter dropdown
  const { data: businesses } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: async () => {
      const res = await businessesApi.getMine()
      return res.data
    },
  })

  // Fetch reviews on owner's businesses
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-business-reviews', businessFilter, page],
    queryFn: async () => {
      const res = await reviewsApi.listMyBusinessReviews({
        businessId: businessFilter === 'all' ? undefined : businessFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      return res.data
    },
    placeholderData: (prev) => prev,
  })

  // Flag mutation
  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reviewsApi.flagReview(id, reason),
    onSuccess: () => {
      pushToast('success', 'Review flagged successfully. An admin will review it shortly.')
      setFlagTarget(null)
      queryClient.invalidateQueries({ queryKey: ['my-business-reviews'] })
    },
    onError: () => {
      pushToast('error', 'Failed to flag review. Please try again.')
    },
  })

  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  function handleBusinessChange(value: string) {
    setBusinessFilter(value)
    setPage(1)
  }

  function handleFlag(id: string, reason: string) {
    flagMutation.mutate({ id, reason })
  }

  // Find business name for a given review
  function getBusinessName(businessId: string) {
    return businesses?.find((b) => b.id === businessId)?.name ?? null
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-surface-900">Reviews</h1>
        <p className="mt-1 text-sm text-surface-500">
          Reviews left by customers on your businesses.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <label htmlFor="business-filter" className="text-sm font-medium text-surface-600 shrink-0">
          Business
        </label>
        <select
          id="business-filter"
          value={businessFilter}
          onChange={(e) => handleBusinessChange(e.target.value)}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 transition-colors"
        >
          <option value="all">All businesses</option>
          {businesses?.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {!isLoading && !isError && data && (
          <span className="text-xs text-surface-400 ml-auto">
            {total} {total === 1 ? 'review' : 'reviews'}
          </span>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-red-400" />
          <p className="text-sm font-medium text-red-700">Failed to load reviews.</p>
          <p className="mt-1 text-xs text-red-500">Please refresh the page or try again later.</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !isError && (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data && data.items.length === 0 && (
        <div className="rounded-xl border border-surface-200 bg-white p-16 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
            <MessageSquare className="h-7 w-7 text-surface-400" />
          </div>
          <p className="text-sm font-medium text-surface-600">No reviews yet</p>
          <p className="mt-1 text-xs text-surface-400">
            {businessFilter === 'all'
              ? "Your businesses haven't received any reviews yet."
              : 'No reviews found for this business.'}
          </p>
        </div>
      )}

      {/* Review cards */}
      {!isLoading && !isError && data && data.items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid gap-4"
        >
          {data.items.map((review) => {
            const reviewerName = review.reviewer
              ? `${review.reviewer.firstName} ${review.reviewer.lastInitial}.`
              : 'Anonymous'
            const businessName = getBusinessName(review.businessId)
            const statusKey = review.status.toLowerCase()

            return (
              <div
                key={review.id}
                className="rounded-xl border border-surface-100 bg-white p-5 shadow-card transition-shadow hover:shadow-elevated"
              >
                {/* Top row: reviewer info + status */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-surface-900 truncate">
                        {reviewerName}
                      </p>
                      <StarRating rating={review.rating} />
                    </div>
                    {businessName && businessFilter === 'all' && (
                      <p className="mt-0.5 text-xs text-surface-400">{businessName}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      STATUS_BADGE[statusKey] || 'bg-surface-100 text-surface-600 ring-1 ring-inset ring-surface-200'
                    }`}
                  >
                    {review.status}
                  </span>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="mt-3 text-sm text-surface-600 leading-relaxed">
                    {review.comment}
                  </p>
                )}

                {/* Bottom row: date + flag action */}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-surface-400">{formatDate(review.createdAt)}</p>
                  {statusKey !== 'flagged' && statusKey !== 'removed' && (
                    <button
                      type="button"
                      onClick={() => setFlagTarget(review.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Flag
                    </button>
                  )}
                  {statusKey === 'flagged' && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
                      <Flag className="h-3.5 w-3.5" />
                      Flagged
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-100 pt-4 mt-2">
              <p className="text-xs text-surface-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center justify-center rounded-lg border border-surface-200 p-1.5 text-surface-600 transition-colors hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center justify-center rounded-lg border border-surface-200 p-1.5 text-surface-600 transition-colors hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Flag modal */}
      {flagTarget && (
        <FlagModal
          reviewId={flagTarget}
          onClose={() => setFlagTarget(null)}
          onSubmit={handleFlag}
          isSubmitting={flagMutation.isPending}
        />
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
