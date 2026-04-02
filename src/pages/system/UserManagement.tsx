import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { UserPlus, Eye, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { systemAdminApi } from '@/api/systemAdmin'
import type { UserRole, UserStatus } from '@/api/types'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

const roleBadge: Record<UserRole, string> = {
  system_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  business_owner: 'bg-amber-100 text-amber-700',
  contractor: 'bg-teal-100 text-teal-700',
  public_user: 'bg-surface-100 text-surface-600',
}

const roleLabel: Record<UserRole, string> = {
  system_admin: 'System Admin',
  admin: 'Admin',
  business_owner: 'Business Owner',
  contractor: 'Contractor',
  public_user: 'Public User',
}

const statusBadge: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-surface-100 text-surface-600',
  suspended: 'bg-red-100 text-red-700',
  pending_verification: 'bg-amber-100 text-amber-700',
}

const statusLabel: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  pending_verification: 'Pending',
}

export default function UserManagement() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'system_admin',
  })
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['system', 'users', { page, role: roleFilter, status: statusFilter }],
    queryFn: () =>
      systemAdminApi
        .listUsers({
          page,
          pageSize: 15,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        })
        .then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => systemAdminApi.createAdminUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'users'] })
      setModalOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.detail || err?.response?.data?.message || 'Failed to create user.')
    },
  })

  function resetForm() {
    setForm({ firstName: '', lastName: '', email: '', password: '', role: 'admin' })
    setFormError('')
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setFormError('All fields are required.')
      return
    }
    createMutation.mutate(form)
  }

  const users = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <motion.div
      className="max-w-6xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <motion.div variants={fadeIn} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 mb-1">User Management</h1>
          <p className="text-surface-500">View, search, and manage all platform users.</p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true) }}
          className="bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Create Admin
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeIn} className="flex flex-wrap gap-3 mb-5">
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">All Roles</option>
          <option value="system_admin">System Admin</option>
          <option value="admin">Admin</option>
          <option value="business_owner">Business Owner</option>
          <option value="contractor">Contractor</option>
          <option value="public_user">Public User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="pending_verification">Pending Verification</option>
        </select>
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
                <th className="px-4 py-3 font-semibold text-surface-600">Name</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Email</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Role</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Status</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Verified</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Joined</th>
                <th className="px-4 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-surface-50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <span className="inline-block w-20 h-4 rounded bg-surface-100 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-surface-50 hover:bg-surface-25 transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-800">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-surface-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[user.role]}`}>
                        {roleLabel[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[user.status]}`}>
                        {statusLabel[user.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.emailVerified ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-surface-300" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-surface-500 tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/system/users/${user.id}`}
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
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
              Page {data?.page ?? 1} of {totalPages} ({data?.total ?? 0} users)
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

      {/* Create Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
          >
            <h2 className="text-lg font-bold text-surface-900 mb-4">Create Admin User</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">First Name</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'system_admin' })}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  <option value="admin">Admin</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
