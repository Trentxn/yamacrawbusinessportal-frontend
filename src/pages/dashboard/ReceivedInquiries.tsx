import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Inbox,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
  Clock,
  MessageSquare,
} from 'lucide-react'
import { serviceRequestsApi } from '@/api/serviceRequests'
import type { ServiceRequestStatus } from '@/api/types'

// ─── Status config ────────────────────────────────────────────────────────────

type FilterStatus = ServiceRequestStatus | 'all'

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'all',     label: 'All'     },
  { value: 'open',    label: 'Open'    },
  { value: 'read',    label: 'Read'    },
  { value: 'replied', label: 'Replied' },
  { value: 'closed',  label: 'Closed'  },
  { value: 'spam',    label: 'Spam'    },
]

const STATUS_BADGE: Record<ServiceRequestStatus, string> = {
  open:    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  read:    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  replied: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  closed:  'bg-surface-100 text-surface-500 ring-1 ring-inset ring-surface-200',
  spam:    'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
}

const STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  open:    'Open',
  read:    'Read',
  replied: 'Replied',
  closed:  'Closed',
  spam:    'Spam',
}

// ─── Page size ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-4">
        <div className="h-4 w-32 bg-surface-100 rounded mb-1.5" />
        <div className="h-3 w-44 bg-surface-100 rounded" />
      </td>
      <td className="px-5 py-4">
        <div className="h-4 w-28 bg-surface-100 rounded" />
      </td>
      <td className="px-5 py-4">
        <div className="h-4 w-48 bg-surface-100 rounded" />
      </td>
      <td className="px-5 py-4">
        <div className="h-5 w-16 bg-surface-100 rounded-full" />
      </td>
      <td className="px-5 py-4">
        <div className="h-4 w-24 bg-surface-100 rounded" />
      </td>
      <td className="px-5 py-4">
        <div className="h-4 w-10 bg-surface-100 rounded" />
      </td>
    </tr>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReceivedInquiries() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['received-inquiries', statusFilter, page],
    queryFn: async () => {
      const res = await serviceRequestsApi.listReceived({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        pageSize: PAGE_SIZE,
      })
      return res.data
    },
    placeholderData: (prev) => prev,
  })

  const totalPages = data?.totalPages ?? 1
  const total      = data?.total ?? 0

  function handleStatusChange(value: FilterStatus) {
    setStatusFilter(value)
    setPage(1)
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-surface-900">Received Inquiries</h1>
        <p className="mt-1 text-sm text-surface-500">
          Messages sent to your business by customers and visitors.
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-5 flex items-center gap-3">
        <label htmlFor="status-filter" className="text-sm font-medium text-surface-600 shrink-0">
          Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value as FilterStatus)}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-800 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20 transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {!isLoading && !isError && data && (
          <span className="text-xs text-surface-400 ml-auto">
            {total} {total === 1 ? 'inquiry' : 'inquiries'}
          </span>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-7 w-7 text-red-400" />
          <p className="text-sm font-medium text-red-700">Failed to load inquiries.</p>
          <p className="mt-1 text-xs text-red-500">Please refresh the page or try again later.</p>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Sender
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Business
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Subject
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                  : data && data.items.length > 0
                  ? data.items.map((inquiry) => (
                      <tr
                        key={inquiry.id}
                        className="group transition-colors hover:bg-surface-50"
                      >
                        {/* Sender */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-surface-900">{inquiry.senderName}</p>
                          <p className="mt-0.5 text-xs text-surface-400">{inquiry.senderEmail}</p>
                        </td>

                        {/* Business name */}
                        <td className="px-5 py-4">
                          <p className="text-surface-700 text-sm">
                            {inquiry.businessName || '-'}
                          </p>
                        </td>

                        {/* Subject + message count */}
                        <td className="px-5 py-4">
                          <p className="max-w-[220px] truncate text-surface-700">
                            {inquiry.subject}
                          </p>
                          {inquiry.messages && inquiry.messages.length > 0 && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-surface-400">
                              <MessageSquare className="h-3 w-3" />
                              {inquiry.messages.length} {inquiry.messages.length === 1 ? 'message' : 'messages'}
                            </span>
                          )}
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inquiry.status]}`}
                          >
                            {STATUS_LABEL[inquiry.status]}
                          </span>
                        </td>

                        {/* Date + time ago */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-surface-500 text-sm">{formatDate(inquiry.createdAt)}</p>
                          <p className="mt-0.5 text-xs text-surface-400 inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(inquiry.createdAt)}
                          </p>
                        </td>

                        {/* View link */}
                        <td className="px-5 py-4">
                          <Link
                            to={`/dashboard/inquiries/${inquiry.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  : (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center">
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
                            <Inbox className="h-7 w-7 text-surface-400" />
                          </div>
                          <p className="text-sm font-medium text-surface-600">No inquiries found</p>
                          <p className="mt-1 text-xs text-surface-400">
                            {statusFilter === 'all'
                              ? "You haven't received any inquiries yet."
                              : `No ${STATUS_LABEL[statusFilter as ServiceRequestStatus].toLowerCase()} inquiries.`}
                          </p>
                        </td>
                      </tr>
                    )
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!isLoading && data && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-100 px-5 py-3">
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
    </div>
  )
}
