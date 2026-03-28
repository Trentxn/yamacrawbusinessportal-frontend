import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { motion } from 'framer-motion'
import {
  Search,
  Star,
  Eye,
  ChevronLeft,
  ChevronRight,
  Building2,
  Loader2,
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
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const { data: categories } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((r) => r.data),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'businesses', statusFilter, categoryFilter, page],
    queryFn: () =>
      adminApi.listAllBusinesses({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page,
        pageSize,
      }).then((r) => r.data),
  })

  const businesses = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

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
      <h1 className="text-3xl font-bold text-surface-900 mb-2">
        All Businesses
      </h1>
      <p className="text-surface-500 mb-8">
        View and manage all business listings on the platform.
      </p>

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
            Loading businesses...
          </div>
        ) : isError ? (
          <div className="py-20 text-center text-red-500">
            Failed to load businesses. Please try again.
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-400">
            <Building2 className="h-10 w-10 mb-3 text-surface-300" />
            <p>No businesses found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-surface-100 bg-surface-50 text-left text-xs font-medium uppercase tracking-wider text-surface-500">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Featured</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map((biz) => (
                <tr key={biz.id} className="hover:bg-surface-50 transition-colors">
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
                      <span className="font-medium text-surface-800">
                        {biz.name}
                      </span>
                    </div>
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
                    <Link
                      to={`${basePath}/businesses/${biz.id}`}
                      className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Link>
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
