import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bug, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { bugReportsApi } from '@/api/bugReports'
import type { BugReport } from '@/api/bugReports'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

type StatusFilter = '' | 'open' | 'in_progress' | 'resolved' | 'dismissed'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
]

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  dismissed: 'bg-surface-100 text-surface-500 border-surface-200',
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function BugReports() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  // Modal state
  const [modalReport, setModalReport] = useState<BugReport | null>(null)
  const [modalStatus, setModalStatus] = useState('')
  const [modalNote, setModalNote] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['system', 'bug-reports', { page, status: statusFilter }],
    queryFn: () =>
      bugReportsApi
        .list({ status: statusFilter || undefined, page, pageSize: 20 })
        .then((r) => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, resolutionNote }: { id: string; status: string; resolutionNote?: string }) =>
      bugReportsApi.update(id, { status, resolutionNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'bug-reports'] })
      setModalReport(null)
      showToast('success', 'Bug report updated successfully.')
    },
    onError: () => {
      showToast('error', 'Failed to update bug report.')
    },
  })

  function showToast(type: Toast['type'], message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function openModal(report: BugReport) {
    setModalReport(report)
    setModalStatus(report.status)
    setModalNote('')
  }

  function handleSubmitUpdate() {
    if (!modalReport) return
    updateMutation.mutate({
      id: modalReport.id,
      status: modalStatus,
      resolutionNote: modalNote || undefined,
    })
  }

  const reports = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <motion.div
      className="max-w-6xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-600">
            <Bug className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-surface-900 mb-1">Bug Reports</h1>
            <p className="text-surface-500">Review and manage user-submitted bug reports.</p>
          </div>
        </div>
      </motion.div>

      {/* Filter */}
      <motion.div variants={fadeIn} className="flex items-center gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {data && (
          <span className="text-xs text-surface-400">
            {data.total} report{data.total !== 1 ? 's' : ''} found
          </span>
        )}
      </motion.div>

      {/* Error state */}
      {isError && (
        <motion.div
          variants={fadeIn}
          className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-center gap-3 mb-5"
        >
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">Failed to load bug reports. Please try again later.</p>
        </motion.div>
      )}

      {/* Table */}
      {!isError && (
        <motion.div
          variants={fadeIn}
          className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50 text-left">
                  <th className="px-4 py-3 font-semibold text-surface-600 w-8" />
                  <th className="px-4 py-3 font-semibold text-surface-600">Subject</th>
                  <th className="px-4 py-3 font-semibold text-surface-600">Reporter</th>
                  <th className="px-4 py-3 font-semibold text-surface-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-surface-600">Page</th>
                  <th className="px-4 py-3 font-semibold text-surface-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-surface-600 w-20" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-surface-50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <span className="inline-block w-20 h-4 rounded bg-surface-100 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Bug className="h-8 w-8 text-surface-300 mx-auto mb-3" />
                      <p className="text-surface-400 font-medium">No bug reports found</p>
                      <p className="text-surface-300 text-xs mt-1">
                        {statusFilter ? 'Try changing the status filter.' : 'No reports have been submitted yet.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const isExpanded = expandedId === report.id
                    return (
                      <motion.tr
                        key={report.id}
                        layout
                        className="border-b border-surface-50 hover:bg-surface-25 transition-colors group"
                      >
                        <td colSpan={7} className="p-0">
                          <div>
                            {/* Main row */}
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => setExpandedId(isExpanded ? null : report.id)}
                            >
                              <div className="px-4 py-3 flex-shrink-0 w-8">
                                {isExpanded
                                  ? <ChevronUp className="h-4 w-4 text-surface-400" />
                                  : <ChevronDown className="h-4 w-4 text-surface-400" />
                                }
                              </div>
                              <div className="px-4 py-3 flex-1 min-w-0">
                                <span className="text-surface-800 font-medium truncate block">
                                  {report.subject}
                                </span>
                              </div>
                              <div className="px-4 py-3 flex-shrink-0 w-48">
                                <div className="text-surface-700 text-xs font-medium truncate">{report.userName}</div>
                                <div className="text-surface-400 text-xs truncate">{report.userEmail}</div>
                              </div>
                              <div className="px-4 py-3 flex-shrink-0 w-32">
                                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[report.status] ?? STATUS_BADGE.open}`}>
                                  {statusLabel(report.status)}
                                </span>
                              </div>
                              <div className="px-4 py-3 flex-shrink-0 w-40">
                                {report.pageUrl ? (
                                  <a
                                    href={report.pageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-1 truncate"
                                  >
                                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">{report.pageUrl.replace(/^https?:\/\/[^/]+/, '')}</span>
                                  </a>
                                ) : (
                                  <span className="text-surface-300 text-xs">--</span>
                                )}
                              </div>
                              <div className="px-4 py-3 flex-shrink-0 w-28 text-surface-500 text-xs tabular-nums whitespace-nowrap">
                                {formatDate(report.createdAt)}
                              </div>
                              <div className="px-4 py-3 flex-shrink-0 w-20">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openModal(report) }}
                                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
                                >
                                  Update
                                </button>
                              </div>
                            </div>

                            {/* Expanded detail */}
                            {isExpanded && (
                              <div className="px-12 pb-4">
                                <div className="rounded-lg bg-surface-50 border border-surface-100 p-4 text-sm text-surface-600 whitespace-pre-wrap">
                                  {report.description}
                                </div>
                                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-surface-400">
                                  <span>Submitted {formatDateTime(report.createdAt)}</span>
                                  {report.userAgent && (
                                    <span className="truncate max-w-md" title={report.userAgent}>
                                      UA: {report.userAgent}
                                    </span>
                                  )}
                                  {report.resolvedAt && (
                                    <span>Resolved {formatDateTime(report.resolvedAt)} by {report.resolverName ?? 'Unknown'}</span>
                                  )}
                                  {report.resolutionNote && (
                                    <span className="w-full mt-1 text-surface-500">
                                      Resolution: {report.resolutionNote}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-surface-100 px-4 py-3">
              <p className="text-xs text-surface-400">
                Page {data?.page ?? 1} of {totalPages} ({data?.total ?? 0} reports)
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Update Modal */}
      {modalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setModalReport(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-xl shadow-card border border-surface-200 w-full max-w-md mx-4 p-6"
          >
            <h2 className="text-lg font-semibold text-surface-900 mb-1">Update Bug Report</h2>
            <p className="text-sm text-surface-500 mb-5 truncate" title={modalReport.subject}>
              {modalReport.subject}
            </p>

            <label className="block text-sm font-medium text-surface-700 mb-1.5">Status</label>
            <select
              value={modalStatus}
              onChange={(e) => setModalStatus(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-300 mb-4"
            >
              {STATUS_OPTIONS.filter((o) => o.value !== '').map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Resolution note <span className="text-surface-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              rows={3}
              placeholder="Add context about the resolution..."
              className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none mb-5"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setModalReport(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUpdate}
                disabled={updateMutation.isPending}
                className="rounded-lg bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
