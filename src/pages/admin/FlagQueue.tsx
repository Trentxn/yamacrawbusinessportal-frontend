import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  User,
  Calendar,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import type { ModerationFlag } from '@/api/admin'

const ACTION_OPTIONS = [
  { value: 'dismiss', label: 'Dismiss' },
  { value: 'warn', label: 'Warn User' },
  { value: 'suspend', label: 'Suspend Content' },
  { value: 'ban', label: 'Ban User' },
]

function ResolveForm({
  flag,
  onDone,
}: {
  flag: ModerationFlag
  onDone: () => void
}) {
  const queryClient = useQueryClient()
  const [action, setAction] = useState('')
  const [note, setNote] = useState('')

  const resolveMutation = useMutation({
    mutationFn: () =>
      adminApi.resolveFlag(flag.id, {
        actionTaken: action,
        resolutionNote: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'flags'] })
      onDone()
    },
  })

  return (
    <div className="mt-4 border-t border-surface-100 pt-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-surface-500 mb-1">
            Action
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select action...</option>
            {ACTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-[2] min-w-[200px]">
          <label className="block text-xs font-medium text-surface-500 mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Resolution note..."
            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => resolveMutation.mutate()}
          disabled={!action || resolveMutation.isPending}
          className="inline-flex items-center gap-1.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap"
        >
          <CheckCircle2 className="h-4 w-4" />
          {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
        </button>
        <button
          onClick={onDone}
          className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
      {resolveMutation.isError && (
        <p className="mt-2 text-sm text-red-500">
          Failed to resolve flag. Please try again.
        </p>
      )}
    </div>
  )
}

export default function FlagQueue() {
  const [page, setPage] = useState(1)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const pageSize = 15

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'flags', page],
    queryFn: () => adminApi.listFlags({ page, pageSize }).then((r) => r.data),
  })

  const allFlags = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  // Show unresolved flags (actionTaken is null)
  const unresolvedFlags = allFlags.filter((f) => f.actionTaken === null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto py-10 px-6"
    >
      <h1 className="text-3xl font-bold text-surface-900 mb-2">
        Moderation Flags
      </h1>
      <p className="text-surface-500 mb-8">
        Review flagged content and take appropriate action.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-surface-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading flags...
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-red-500">
          Failed to load flags. Please try again.
        </div>
      ) : unresolvedFlags.length === 0 ? (
        <div className="rounded-xl border border-surface-200 bg-white shadow-card flex flex-col items-center justify-center py-20 text-surface-400">
          <Flag className="h-10 w-10 mb-3 text-surface-300" />
          <p className="font-medium">No unresolved flags</p>
          <p className="text-sm mt-1">All flagged content has been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {unresolvedFlags.map((flag) => (
            <div
              key={flag.id}
              className="rounded-xl border border-surface-200 bg-white shadow-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                      <Flag className="h-3 w-3" />
                      {flag.targetType}
                    </span>
                    <span className="text-xs text-surface-400">
                      Target ID: {flag.targetId}
                    </span>
                  </div>

                  <p className="text-sm text-surface-800 mb-3">
                    {flag.reason}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400">
                    {flag.flaggedBy && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Reported by: {flag.flaggedByName || flag.flaggedBy}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(flag.createdAt).toLocaleDateString()}{' '}
                      {new Date(flag.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {resolvingId !== flag.id && (
                  <button
                    onClick={() => setResolvingId(flag.id)}
                    className="bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap flex-shrink-0"
                  >
                    Resolve
                  </button>
                )}
              </div>

              {resolvingId === flag.id && (
                <ResolveForm
                  flag={flag}
                  onDone={() => setResolvingId(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}

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
