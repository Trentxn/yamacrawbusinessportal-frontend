import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import type { ServiceRequestStatus } from '@/api/types'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
]

const statusBadge: Record<ServiceRequestStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  read: 'bg-amber-100 text-amber-800',
  replied: 'bg-green-100 text-green-800',
  closed: 'bg-surface-100 text-surface-600',
  spam: 'bg-red-100 text-red-800',
}

function InquiryStatusBadge({ status }: { status: ServiceRequestStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge[status] ?? 'bg-surface-100 text-surface-600'}`}
    >
      {status}
    </span>
  )
}

export default function AdminInquiries() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith('/system') ? '/system' : '/admin'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'inquiries', statusFilter, page],
    queryFn: () =>
      adminApi.listAllInquiries({
        status: statusFilter || undefined,
        page,
        pageSize,
      }).then((r) => r.data),
  })

  const inquiries = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto py-10 px-6"
    >
      <h1 className="text-3xl font-bold text-surface-900 mb-2">
        All Inquiries
      </h1>
      <p className="text-surface-500 mb-8">
        Monitor and manage all inquiries across the platform.
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
          <div className="flex items-center justify-center py-20 text-surface-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading inquiries...
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-red-500">
            Failed to load inquiries. Please try again.
          </div>
        ) : inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-400">
            <Inbox className="h-10 w-10 mb-3 text-surface-300" />
            <p>No inquiries found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <th className="px-5 py-3">Sender</th>
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {inquiries.map((inq) => (
                <tr
                  key={inq.id}
                  onClick={() => navigate(`${basePath}/inquiries/${inq.id}`)}
                  className="hover:bg-surface-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-surface-800">
                        {inq.senderName}
                      </p>
                      <p className="text-xs text-surface-400">
                        {inq.senderEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-surface-600">
                    {inq.businessName ?? inq.businessId}
                  </td>
                  <td className="px-5 py-3.5 text-surface-700 max-w-xs truncate">
                    {inq.subject}
                  </td>
                  <td className="px-5 py-3.5">
                    <InquiryStatusBadge status={inq.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right text-surface-500 text-xs whitespace-nowrap">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
    </motion.div>
  )
}
