import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  HardHat,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { adminApi } from '@/api/admin'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
]

const statusBadge: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending_review: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  draft: 'bg-surface-100 text-surface-600',
  suspended: 'bg-red-100 text-red-700',
  archived: 'bg-surface-100 text-surface-500',
}

function StatusBadge({ status }: { status: string }) {
  const label = status.replace('_', ' ')
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge[status] ?? 'bg-surface-100 text-surface-600'}`}
    >
      {label}
    </span>
  )
}

export default function AdminBusinessList() {
  const basePath = useAdminBasePath()
  const { user } = useAuth()
  const isSystemAdmin = user?.role === 'system_admin'
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)
  const [rowConfirmId, setRowConfirmId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'businesses', statusFilter, categoryFilter, typeFilter, page],
    queryFn: () =>
      adminApi.listAllBusinesses({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        listingType: typeFilter || undefined,
        page,
        pageSize,
      }).then((r) => r.data),
  })

  const businesses = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    queryClient.invalidateQueries({ queryKey: ['businesses'] })
  }

  const bulkDeleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAllDemoBusinesses().then((r) => r.data),
    onSuccess: (data) => {
      setActionMessage(data.message)
      setBulkConfirmOpen(false)
      invalidate()
      setTimeout(() => setActionMessage(null), 4000)
    },
  })

  const rowDeleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.hardDeleteDemoBusiness(id).then((r) => r.data),
    onSuccess: (data) => {
      setActionMessage(data.message)
      setRowConfirmId(null)
      invalidate()
      setTimeout(() => setActionMessage(null), 4000)
    },
  })

  const rowToConfirm = rowConfirmId ? businesses.find((b) => b.id === rowConfirmId) : null

  const filtered = search
    ? businesses.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      )
    : businesses

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-6xl mx-auto py-10 px-6"
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">
            All Listings
          </h1>
          <p className="text-surface-500">
            View and manage all business and contractor listings on the platform.
          </p>
        </div>
        {isSystemAdmin && (
          <button
            onClick={() => setBulkConfirmOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
          >
            <Trash2 className="h-4 w-4" />
            Remove All Demo Listings
          </button>
        )}
      </div>

      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700"
          >
            {actionMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
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

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Types</option>
          <option value="business">Business</option>
          <option value="contractor">Contractor</option>
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-surface-200 bg-white pl-9 pr-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-surface-400">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading listings...
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-red-500">
            Failed to load businesses. Please try again.
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-400">
            <Building2 className="h-10 w-10 mb-3 text-surface-300" />
            <p>No listings found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Featured</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map((biz) => (
                <tr key={biz.id} className={`transition-colors hover:bg-surface-50 ${biz.isDemo ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {biz.logoUrl ? (
                        <img
                          src={biz.logoUrl}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-surface-800">
                          {biz.name}
                        </span>
                        {biz.isDemo && (
                          <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                            Demo
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {biz.listingType === 'contractor' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        <HardHat className="h-3 w-3" />
                        Contractor
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-600">
                        <Building2 className="h-3 w-3" />
                        Business
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-surface-600">
                    {biz.category ?? '--'}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={biz.status} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {biz.isFeatured ? (
                      <Star className="inline h-4 w-4 fill-accent-400 text-accent-400" />
                    ) : (
                      <Star className="inline h-4 w-4 text-surface-300" />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`${basePath}/businesses/${biz.id}`}
                        className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                      {isSystemAdmin && biz.isDemo && (
                        <button
                          onClick={() => setRowConfirmId(biz.id)}
                          className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-800 font-medium text-sm"
                          title="Permanently delete this demo listing"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Bulk delete confirmation */}
      <AnimatePresence>
        {bulkConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm px-4"
            onClick={() => !bulkDeleteMutation.isPending && setBulkConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-xl"
            >
              <button
                onClick={() => setBulkConfirmOpen(false)}
                disabled={bulkDeleteMutation.isPending}
                className="absolute right-4 top-4 text-surface-400 hover:text-surface-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-surface-900">
                Remove all demo listings?
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-surface-600">
                This will permanently delete every listing flagged as a demo across the entire directory. This action cannot be undone.
              </p>
              {bulkDeleteMutation.isError && (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Failed to remove demo listings. Please try again.
                </p>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setBulkConfirmOpen(false)}
                  disabled={bulkDeleteMutation.isPending}
                  className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => bulkDeleteMutation.mutate()}
                  disabled={bulkDeleteMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Remove All Demos
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single-row delete confirmation */}
      <AnimatePresence>
        {rowConfirmId && rowToConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface-900/40 backdrop-blur-sm px-4"
            onClick={() => !rowDeleteMutation.isPending && setRowConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-xl"
            >
              <button
                onClick={() => setRowConfirmId(null)}
                disabled={rowDeleteMutation.isPending}
                className="absolute right-4 top-4 text-surface-400 hover:text-surface-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-surface-900">
                Delete demo listing?
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-surface-600">
                &ldquo;{rowToConfirm.name}&rdquo; will be permanently removed from the directory. This action cannot be undone.
              </p>
              {rowDeleteMutation.isError && (
                <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  Failed to delete listing. Please try again.
                </p>
              )}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRowConfirmId(null)}
                  disabled={rowDeleteMutation.isPending}
                  className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => rowDeleteMutation.mutate(rowToConfirm.id)}
                  disabled={rowDeleteMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {rowDeleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete Listing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
