import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { serviceRequestsApi } from '@/api/serviceRequests'
import type { ServiceRequestStatus } from '@/api/types'

const statusColors: Record<ServiceRequestStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  read: 'bg-amber-100 text-amber-800',
  replied: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
  spam: 'bg-red-100 text-red-800',
}

export default function UserInquiries() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user', 'inquiries', page],
    queryFn: () => serviceRequestsApi.listSent({ page, pageSize: 10 }).then(r => r.data),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto py-10 px-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-7 h-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Inquiries</h1>
          <p className="text-surface-500 text-sm">Inquiries you've sent to businesses</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-100 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          Failed to load inquiries. Please try again.
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-surface-300 mx-auto mb-3" />
          <p className="text-surface-500">You haven't sent any inquiries yet.</p>
          <Link to="/directory" className="text-primary-600 hover:underline text-sm mt-2 inline-block">
            Browse the directory
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-surface-200 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Business</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-surface-600">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {data.items.map(inq => (
                  <tr key={inq.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-900">
                      {inq.businessName ?? 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-surface-700">{inq.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inq.status]}`}>
                        {inq.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-500">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/account/inquiries/${inq.id}`}
                        className="text-primary-600 hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-surface-500">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-surface-200 disabled:opacity-40 hover:bg-surface-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.totalPages}
                  className="p-2 rounded-lg border border-surface-200 disabled:opacity-40 hover:bg-surface-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
