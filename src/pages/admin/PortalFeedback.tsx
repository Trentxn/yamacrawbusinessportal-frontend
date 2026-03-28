import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Star,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import client from '@/api/client'

interface FeedbackStats {
  averageRating: number
  totalCount: number
  distribution: Record<string, number>
}

interface FeedbackEntry {
  id: string
  rating: number
  comment: string | null
  userName: string | null
  isFeatured: boolean
  isHidden: boolean
  createdAt: string
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${
            i <= Math.round(rating)
              ? 'fill-accent-500 text-accent-500'
              : 'text-surface-200'
          }`}
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
          <td className="px-5 py-4"><div className="h-3.5 w-16 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-4 w-48 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-4 w-24 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-4 w-20 animate-pulse rounded bg-surface-100" /></td>
          <td className="px-5 py-4"><div className="h-4 w-16 animate-pulse rounded bg-surface-100" /></td>
        </tr>
      ))}
    </>
  )
}

export default function PortalFeedback() {
  const [page, setPage] = useState(1)
  const pageSize = 20
  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['portal-feedback', 'stats'],
    queryFn: () => client.get<FeedbackStats>('/portal-feedback/stats').then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['portal-feedback', page],
    queryFn: () =>
      client
        .get<{ items: FeedbackEntry[]; total: number; page: number; pageSize: number; totalPages: number }>(
          '/portal-feedback',
          { params: { page, pageSize } },
        )
        .then((r) => r.data),
  })

  const featureMutation = useMutation({
    mutationFn: (id: string) => client.put(`/portal-feedback/${id}/feature`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-feedback'] })
    },
  })

  const hideMutation = useMutation({
    mutationFn: (id: string) => client.put(`/portal-feedback/${id}/hide`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-feedback'] })
    },
  })

  const entries = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const distribution = stats?.distribution ?? {}
  const maxDistCount = Math.max(...Object.values(distribution), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto py-10 px-6"
    >
      <h1 className="text-3xl font-bold text-surface-900 mb-2">Portal Feedback</h1>
      <p className="text-surface-500 mb-8">
        User ratings and feedback for the business portal. Feature reviews to display them on the homepage.
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {/* Average rating */}
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-5">
          <p className="text-sm font-medium text-surface-500 mb-2">Average Rating</p>
          {statsLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-surface-100" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary-600">
                {stats?.averageRating ? stats.averageRating.toFixed(1) : '--'}
              </span>
              {stats?.averageRating != null && (
                <StarRating rating={stats.averageRating} size="lg" />
              )}
            </div>
          )}
        </div>

        {/* Total count */}
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-5">
          <p className="text-sm font-medium text-surface-500 mb-2">Total Responses</p>
          {statsLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-surface-100" />
          ) : (
            <span className="text-3xl font-bold text-primary-600">
              {stats?.totalCount ?? 0}
            </span>
          )}
        </div>

        {/* Rating distribution */}
        <div className="rounded-xl border border-surface-200 bg-white shadow-card p-5">
          <p className="text-sm font-medium text-surface-500 mb-3">Distribution</p>
          {statsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 animate-pulse rounded bg-surface-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[String(star)] ?? 0
                const pct = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right text-surface-500 font-medium">{star}</span>
                    <Star className="h-3 w-3 fill-accent-500 text-accent-500" />
                    <div className="flex-1 h-2 rounded-full bg-surface-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-surface-400 tabular-nums">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Feedback table */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                  <th className="px-5 py-3">Rating</th>
                  <th className="px-5 py-3">Comment</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonRows />
              </tbody>
            </table>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <AlertTriangle className="h-8 w-8 mb-3" />
              <p className="font-medium">Failed to load feedback</p>
              <p className="text-sm text-surface-400 mt-1">Please try again later.</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-surface-400">
              <MessageSquare className="h-10 w-10 mb-3 text-surface-300" />
              <p className="font-medium">No feedback yet</p>
              <p className="text-sm mt-1">Feedback from portal users will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                  <th className="px-5 py-3">Rating</th>
                  <th className="px-5 py-3">Comment</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      entry.isHidden
                        ? 'bg-red-50/50 opacity-60'
                        : entry.isFeatured
                          ? 'bg-accent-50/30'
                          : 'hover:bg-surface-50'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <StarRating rating={entry.rating} />
                        {entry.isFeatured && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-100 px-1.5 py-0.5 text-[10px] font-semibold text-accent-700">
                            <Sparkles className="h-2.5 w-2.5" />
                            Featured
                          </span>
                        )}
                        {entry.isHidden && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                            Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-surface-600 max-w-md">
                      <p className="truncate">
                        {entry.comment || <span className="text-surface-300 italic">No comment</span>}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-surface-600 whitespace-nowrap">
                      {entry.userName || 'Anonymous'}
                    </td>
                    <td className="px-5 py-3.5 text-surface-500 text-xs whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => featureMutation.mutate(entry.id)}
                          disabled={entry.isHidden}
                          title={entry.isFeatured ? 'Remove from homepage' : 'Feature on homepage'}
                          className={`rounded-lg p-1.5 text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
                            entry.isFeatured
                              ? 'bg-accent-100 text-accent-600 hover:bg-accent-200'
                              : 'text-surface-400 hover:bg-surface-100 hover:text-accent-600'
                          }`}
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => hideMutation.mutate(entry.id)}
                          title={entry.isHidden ? 'Unhide feedback' : 'Hide feedback'}
                          className={`rounded-lg p-1.5 text-xs transition-colors ${
                            entry.isHidden
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'text-surface-400 hover:bg-surface-100 hover:text-red-600'
                          }`}
                        >
                          {entry.isHidden ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
    </motion.div>
  )
}
