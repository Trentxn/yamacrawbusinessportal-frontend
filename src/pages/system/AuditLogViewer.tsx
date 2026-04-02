import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { systemAdminApi } from '@/api/systemAdmin'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

function UserSearchFilter({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedName, setSelectedName] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const { data: users } = useQuery({
    queryKey: ['system', 'users-lookup', search],
    queryFn: () =>
      systemAdminApi.listUsers({ page: 1, pageSize: 20, search: search || undefined }).then((r) => r.data),
    enabled: open,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const clear = () => {
    setSearch('')
    setSelectedName('')
    onChange('')
  }

  return (
    <div ref={wrapperRef} className="relative w-48">
      {value && selectedName ? (
        <div className="flex items-center gap-1 rounded-lg border border-primary-300 bg-primary-50 px-3 py-2 text-sm">
          <span className="truncate text-primary-700 font-medium">{selectedName}</span>
          <button onClick={clear} className="ml-auto flex-shrink-0 text-primary-400 hover:text-primary-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <input
          type="text"
          placeholder="Search user..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      )}
      {open && !value && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-64 overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-elevated">
          {users?.items && users.items.length > 0 ? (
            users.items.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  const name = `${u.firstName} ${u.lastName}`
                  setSelectedName(name)
                  onChange(u.id)
                  setOpen(false)
                  setSearch('')
                }}
                className="flex w-full flex-col px-3 py-2 text-left hover:bg-surface-50 transition-colors"
              >
                <span className="text-sm font-medium text-surface-800">
                  {u.firstName} {u.lastName}
                </span>
                <span className="text-xs text-surface-400 font-mono">
                  {u.id.slice(0, 8)}... · {u.email}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-xs text-surface-400">
              {search ? 'No users found' : 'Type to search...'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AuditLogViewer() {
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [resource, setResource] = useState('')
  const [userId, setUserId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [exporting, setExporting] = useState(false)

  const filterParams = {
    action: action || undefined,
    resource: resource || undefined,
    userId: userId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system', 'audit-logs', { page, ...filterParams }],
    queryFn: () =>
      systemAdminApi
        .listAuditLogs({ page, pageSize: 20, ...filterParams })
        .then((r) => r.data),
  })

  async function handleExport() {
    setExporting(true)
    try {
      const response = await systemAdminApi.exportAuditLogs(filterParams)
      const blob = new Blob([response.data as BlobPart], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silently fail - could add toast here
    } finally {
      setExporting(false)
    }
  }

  const logs = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  function truncate(str: string | null, len: number) {
    if (!str) return '--'
    return str.length > len ? str.slice(0, len) + '...' : str
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-1">Audit Logs</h1>
          <p className="text-surface-500">Review system audit logs for security and compliance.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn} className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Action type"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300 w-36"
        />
        <input
          type="text"
          placeholder="Resource"
          value={resource}
          onChange={(e) => { setResource(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-300 w-36"
        />
        <UserSearchFilter
          value={userId}
          onChange={(id) => { setUserId(id); setPage(1) }}
        />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </motion.div>

      {/* Table */}
      <motion.div
        variants={fadeIn}
        className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 text-left">
                <th className="px-4 py-3 font-semibold text-surface-600">Timestamp</th>
                <th className="px-4 py-3 font-semibold text-surface-600">User</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Action</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Resource</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Resource ID</th>
                <th className="px-4 py-3 font-semibold text-surface-600">IP Address</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Details</th>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-400">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-surface-50 hover:bg-surface-25 transition-colors">
                    <td className="px-4 py-3 text-surface-600 tabular-nums whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {log.userName ? (
                        <div>
                          <span className="text-sm text-surface-700 font-medium">{log.userName}</span>
                          {log.userId && (
                            <span className="block text-xs text-surface-400 font-mono">{log.userId.slice(0, 8)}...</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-surface-400">{log.userId ? truncate(log.userId, 12) : '--'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-primary-50 text-primary-700 px-2.5 py-0.5 text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-700 font-medium">{log.resource}</td>
                    <td className="px-4 py-3 text-surface-500 font-mono text-xs">
                      {log.resourceId ? truncate(log.resourceId, 12) : '--'}
                    </td>
                    <td className="px-4 py-3 text-surface-500 font-mono text-xs">
                      {log.ipAddress ?? '--'}
                    </td>
                    <td className="px-4 py-3 text-surface-500 text-xs max-w-[200px]">
                      <span title={log.details ?? undefined}>
                        {truncate(log.details, 40)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-surface-100 px-4 py-3">
            <p className="text-xs text-surface-400">
              Page {data?.page ?? 1} of {totalPages} ({data?.total ?? 0} entries)
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
    </motion.div>
  )
}
