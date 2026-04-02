import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Check, X, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react'
import { adminApi } from '@/api/admin'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmModal from '@/components/ConfirmModal'
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

// Admins can only assign these roles; admin/system_admin require system_admin privileges
const adminAssignableRoles: { value: UserRole; label: string }[] = [
  { value: 'public_user', label: 'Public User' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'contractor', label: 'Contractor' },
]

export default function AdminUserList() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const isSystemAdmin = currentUser?.role === 'system_admin'

  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  const [confirmRoleChange, setConfirmRoleChange] = useState<{ userId: string; userName: string; fromRole: UserRole; toRole: UserRole } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { page, role: roleFilter, status: statusFilter }],
    queryFn: () =>
      adminApi
        .listUsers({
          page,
          pageSize: 15,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
        })
        .then((r) => r.data),
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      adminApi.updateUserRole(id, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      setEditingUserId(null)
      setSelectedRole('')
    },
  })

  const users = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  function startEditRole(userId: string, currentRole: UserRole) {
    setEditingUserId(userId)
    setSelectedRole(currentRole)
  }

  function cancelEdit() {
    setEditingUserId(null)
    setSelectedRole('')
  }

  function saveRole(userId: string) {
    if (!selectedRole) return
    const user = users.find((u) => u.id === userId)
    if (!user) return
    setConfirmRoleChange({
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      fromRole: user.role,
      toRole: selectedRole as UserRole,
    })
  }

  // Determine which roles this admin can assign
  const assignableRoles = isSystemAdmin
    ? [
        ...adminAssignableRoles,
        { value: 'admin' as UserRole, label: 'Admin' },
        { value: 'system_admin' as UserRole, label: 'System Admin' },
      ]
    : adminAssignableRoles

  // Can this admin edit this user's role?
  function canEditRole(userRole: UserRole, userId: string): boolean {
    // Can't edit your own role
    if (userId === currentUser?.id) return false
    // Regular admins can't edit admin or system_admin roles
    if (!isSystemAdmin && (userRole === 'admin' || userRole === 'system_admin')) return false
    return true
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
          <h1 className="text-3xl font-bold text-surface-900 mb-1">User Management</h1>
          <p className="text-surface-500">
            View users and manage roles.
            {!isSystemAdmin && (
              <span className="text-surface-400 ml-1">
                You can assign Public User and Business Owner roles.
              </span>
            )}
          </p>
        </div>
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
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="h-10 w-10 text-surface-300 mx-auto mb-2" />
                    <p className="text-surface-400">No users found.</p>
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
                      {editingUserId === user.id ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="rounded-lg border border-surface-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                          {assignableRoles.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[user.role]}`}>
                          {roleLabel[user.role]}
                        </span>
                      )}
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
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => saveRole(user.id)}
                            disabled={selectedRole === user.role || updateRoleMutation.isPending}
                            className="inline-flex items-center gap-1 rounded-lg bg-primary-600 text-white px-2.5 py-1.5 text-xs font-medium hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            {updateRoleMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-xs text-surface-500 hover:bg-surface-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : canEditRole(user.role, user.id) ? (
                        <button
                          onClick={() => startEditRole(user.id, user.role)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-xs"
                        >
                          Change Role
                        </button>
                      ) : (
                        <span className="text-xs text-surface-300">--</span>
                      )}
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

      {updateRoleMutation.isError && (
        <p className="text-sm text-red-600 mt-3">
          Failed to update user role. You may not have permission to assign this role.
        </p>
      )}

      <ConfirmModal
        open={!!confirmRoleChange}
        onClose={() => setConfirmRoleChange(null)}
        onConfirm={() => {
          if (!confirmRoleChange) return
          updateRoleMutation.mutate({ id: confirmRoleChange.userId, role: confirmRoleChange.toRole })
          setConfirmRoleChange(null)
        }}
        title="Change User Role"
        message={
          confirmRoleChange
            ? `Are you sure you want to change ${confirmRoleChange.userName}'s role from "${roleLabel[confirmRoleChange.fromRole]}" to "${roleLabel[confirmRoleChange.toRole]}"?`
            : ''
        }
        confirmLabel="Yes, change role"
        confirmVariant="warning"
        loading={updateRoleMutation.isPending}
      />
    </motion.div>
  )
}
