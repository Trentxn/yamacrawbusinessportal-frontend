import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { motion } from 'framer-motion'
import { ClipboardCheck, Eye, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { adminApi } from '@/api/admin'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function ModerationQueue() {
  const basePath = useAdminBasePath()
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pending', page],
    queryFn: () => adminApi.listPending({ page, pageSize }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  return (
    <motion.div
      className="max-w-6xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={fadeIn} className="flex items-center gap-3 mb-1">
        <h1 className="text-3xl font-bold text-surface-900">Moderation Queue</h1>
        {total > 0 && (
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-sm font-semibold">
            {total}
          </span>
        )}
      </motion.div>
      <motion.p variants={fadeIn} className="text-surface-500 mb-8">
        Review and approve or reject pending business submissions.
      </motion.p>

      <motion.div variants={fadeIn}>
        {isLoading ? (
          <div className="rounded-xl border border-surface-200 bg-white shadow-card divide-y divide-surface-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-surface-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-surface-100 animate-pulse" />
                  <div className="h-3 w-32 rounded bg-surface-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-white shadow-card p-6 sm:p-12 text-center">
            <Inbox className="h-12 w-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">No listings pending review</p>
            <p className="text-sm text-surface-400 mt-1">
              New submissions will appear here for your approval.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
              {/* Table header */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_140px_140px_100px] gap-4 px-5 py-3 bg-surface-50 border-b border-surface-200 text-xs font-semibold text-surface-500 uppercase tracking-wider">
                <span>Business</span>
                <span>Category</span>
                <span>Submitted</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-surface-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px_100px] gap-2 sm:gap-4 items-center px-5 py-4 hover:bg-surface-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <ClipboardCheck className="h-4 w-4 text-primary-600" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-800 truncate">
                          {item.name}
                        </p>
                        {item.shortDescription && (
                          <p className="text-xs text-surface-400 truncate">
                            {item.shortDescription}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-sm text-surface-500">
                      {item.category ?? '--'}
                    </span>

                    <span className="text-sm text-surface-400">
                      {(item as { createdAt?: string }).createdAt
                        ? new Date((item as { createdAt?: string }).createdAt!).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '--'}
                    </span>

                    <div className="text-right">
                      <Link
                        to={`${basePath}/moderation/${item.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-5">
                <p className="text-sm text-surface-500">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
