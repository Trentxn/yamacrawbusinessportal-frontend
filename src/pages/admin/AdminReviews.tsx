import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Star, Flag, Trash2, AlertTriangle, MessageSquare, ChevronLeft, ChevronRight, Loader2, CheckCircle2, XCircle, X, Eye } from 'lucide-react'
import { adminApi } from '@/api/admin'
import type { AdminReview } from '@/api/reviews'

type ReviewStatus = 'approved' | 'flagged' | 'pending'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Reviews' },
  { value: 'approved', label: 'Approved' },
  { value: 'flagged', label: 'Flagged' },
]

const statusBadge: Record<ReviewStatus, string> = {
  approved: 'bg-green-100 text-green-800',
  flagged: 'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
}

function StatusBadge({ status }: { status: string }) {
  const cls = statusBadge[status as ReviewStatus] ?? 'bg-surface-100 text-surface-600'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status === 'approved' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'flagged' && <XCircle className="h-3 w-3" />}
      {status === 'pending' && <AlertTriangle className="h-3 w-3" />}
      {status}
    </span>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'fill-accent-500 text-accent-500' : 'text-surface-200'}`}
        />
      ))}
    </div>
  )
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-surface-100">
          <td className="px-5 py-4"><div className="h-4 w-32 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-4 w-24 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-3.5 w-16 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-4 w-48 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-5 w-16 animate-pulse rounded-full bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-4 w-20 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-7 w-16 animate-pulse rounded bg-surface-100" /></td>
        </tr>
      ))}
    </>
  )
}

function FlagModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: (reason: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center gap-2 text-red-600">
          <Flag className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Flag Review</h3>
        </div>
        <p className="mb-4 text-sm text-surface-500">
          Provide a reason for flagging this review. It will be hidden from public view.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for flagging..."
          rows={3}
          className="mb-4 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Flag Review
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function DeleteModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center gap-2 text-red-600">
          <Trash2 className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Delete Review</h3>
        </div>
        <p className="mb-6 text-sm text-surface-500">
          This will permanently remove the review. This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ReviewDetailModal({
  review,
  onClose,
  onFlag,
  onDelete,
}: {
  review: AdminReview
  onClose: () => void
  onFlag: () => void
  onDelete: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-surface-900 mb-1">Review Detail</h3>
        <p className="text-sm text-surface-500 mb-5">
          For <span className="font-medium text-surface-700">{review.businessName ?? 'Unknown Business'}</span>
        </p>

        <div className="space-y-4">
          {/* Rating */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-surface-400">Rating</label>
            <div className="mt-1">
              <StarRating rating={review.rating} />
            </div>
          </div>

          {/* Reviewer */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-surface-400">Reviewer</label>
            <p className="mt-1 text-sm text-surface-700">
              {review.reviewer ? `${review.reviewer.firstName} ${review.reviewer.lastInitial}.` : 'Anonymous'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-surface-400">Comment</label>
            <div className="mt-1 rounded-lg border border-surface-200 bg-surface-50 p-3">
              <p className="text-sm text-surface-700 whitespace-pre-wrap">{review.comment}</p>
            </div>
          </div>

          {/* Status & Dates */}
          <div className="flex items-center gap-6">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-surface-400">Status</label>
              <div className="mt-1">
                <StatusBadge status={review.status} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-surface-400">Submitted</label>
              <p className="mt-1 text-sm text-surface-600">
                {new Date(review.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-surface-100 pt-4">
          {review.status !== 'flagged' && (
            <button
              onClick={onFlag}
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              <Flag className="h-3.5 w-3.5" />
              Flag
            </button>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminReviews() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [flagTarget, setFlagTarget] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reviews', statusFilter, page],
    queryFn: () =>
      adminApi.listReviews({
        status: statusFilter || undefined,
        page,
        pageSize,
      }).then((r) => r.data),
  })

  const flagMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminApi.flagReview(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      setFlagTarget(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      setDeleteTarget(null)
    },
  })

  const reviews = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const formatReviewerName = (reviewer: { firstName: string; lastInitial: string } | null) => {
    if (!reviewer) return 'Anonymous'
    return `${reviewer.firstName} ${reviewer.lastInitial}.`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto py-10 px-6"
    >
      <h1 className="text-3xl font-bold text-surface-900 mb-2">
        Review Moderation
      </h1>
      <p className="text-surface-500 mb-8">
        Monitor, flag, or remove reviews across all businesses.
      </p>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Reviewer</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Comment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRows />
            </tbody>
          </table>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <AlertTriangle className="h-8 w-8 mb-3" />
            <p className="font-medium">Failed to load reviews</p>
            <p className="text-sm text-surface-400 mt-1">Please try again later.</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-400">
            <MessageSquare className="h-10 w-10 mb-3 text-surface-300" />
            <p className="font-medium">No reviews found</p>
            <p className="text-sm mt-1">
              {statusFilter ? 'Try changing the status filter.' : 'No reviews have been submitted yet.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Reviewer</th>
                <th className="px-5 py-3">Rating</th>
                <th className="px-5 py-3">Comment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {reviews.map((review) => (
                <tr
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className="hover:bg-surface-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5 font-medium text-surface-800 max-w-[160px] truncate">
                    {review.businessName ?? 'Unknown'}
                  </td>
                  <td className="px-5 py-3.5 text-surface-600">
                    {formatReviewerName(review.reviewer)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StarRating rating={review.rating} />
                  </td>
                  <td className="px-5 py-3.5 text-surface-600 max-w-xs">
                    <p className="truncate">{review.comment}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={review.status} />
                  </td>
                  <td className="px-5 py-3.5 text-surface-500 text-xs whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedReview(review) }}
                        title="View review"
                        className="rounded-lg p-1.5 text-surface-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {review.status !== 'flagged' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setFlagTarget(review.id) }}
                          title="Flag review"
                          className="rounded-lg p-1.5 text-surface-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                        >
                          <Flag className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(review.id) }}
                        title="Delete review"
                        className="rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm text-surface-500">
          <span>
            Page {page} of {totalPages}{' '}
            {data?.total != null && <>({data.total} total)</>}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onFlag={() => {
            setSelectedReview(null)
            setFlagTarget(selectedReview.id)
          }}
          onDelete={() => {
            setSelectedReview(null)
            setDeleteTarget(selectedReview.id)
          }}
        />
      )}

      {/* Flag Modal */}
      {flagTarget && (
        <FlagModal
          isLoading={flagMutation.isPending}
          onCancel={() => setFlagTarget(null)}
          onConfirm={(reason) => flagMutation.mutate({ id: flagTarget, reason })}
        />
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          isLoading={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget)}
        />
      )}
    </motion.div>
  )
}
