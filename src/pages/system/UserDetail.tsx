import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, X, Mail, Phone, Shield, Calendar, Clock, Trash2 } from 'lucide-react'
import { systemAdminApi } from '@/api/systemAdmin'
import ConfirmModal from '@/components/ConfirmModal'
import type { UserRole, UserStatus } from '@/api/types'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
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
  pending_verification: 'Pending Verification',
}

const allRoles: UserRole[] = ['system_admin', 'admin', 'business_owner', 'contractor', 'public_user']
const allStatuses: UserStatus[] = ['active', 'inactive', 'suspended', 'pending_verification']

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery({
    queryKey: ['system', 'user', id],
    queryFn: () => systemAdminApi.getUser(id!).then((r) => r.data),
    enabled: !!id,
  })

  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('')
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role)
      setSelectedStatus(user.status)
    }
  }, [user])

  const updateMutation = useMutation({
    mutationFn: (data: { role?: string; status?: string }) =>
      systemAdminApi.updateUser(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'user', id] })
      queryClient.invalidateQueries({ queryKey: ['system', 'users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => systemAdminApi.deleteUser(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system', 'users'] })
      navigate('/system/users')
    },
  })

  function handleSaveRole() {
    if (selectedRole && selectedRole !== user?.role) {
      updateMutation.mutate({ role: selectedRole })
    }
  }

  function handleSaveStatus() {
    if (selectedStatus && selectedStatus !== user?.status) {
      updateMutation.mutate({ status: selectedStatus })
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded bg-surface-100 animate-pulse" />
          <div className="h-4 w-64 rounded bg-surface-100 animate-pulse" />
          <div className="h-64 rounded-xl bg-surface-100 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6 text-center">
        <p className="text-surface-500">User not found.</p>
        <button
          onClick={() => navigate('/system/users')}
          className="mt-4 text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          Back to User Management
        </button>
      </div>
    )
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <motion.div variants={fadeIn}>
        <Link
          to="/system/users"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User Management
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeIn} className="flex items-start gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl shrink-0">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadge[user.role]}`}>
              {roleLabel[user.role]}
            </span>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[user.status]}`}>
              {statusLabel[user.status]}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <motion.div
          variants={fadeIn}
          className="rounded-xl border border-surface-200 bg-white shadow-card p-6"
        >
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4">
            Profile Information
          </h2>
          <dl className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-surface-400 mt-0.5" />
              <div>
                <dt className="text-xs text-surface-400">Email</dt>
                <dd className="text-sm font-medium text-surface-800">{user.email}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-surface-400 mt-0.5" />
              <div>
                <dt className="text-xs text-surface-400">Phone</dt>
                <dd className="text-sm font-medium text-surface-800">
                  {user.phone || 'Not provided'}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-surface-400 mt-0.5" />
              <div>
                <dt className="text-xs text-surface-400">Email Verified</dt>
                <dd className="flex items-center gap-1.5 text-sm font-medium">
                  {user.emailVerified ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-700">Verified</span>
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 text-red-400" />
                      <span className="text-red-600">Not verified</span>
                    </>
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-surface-400 mt-0.5" />
              <div>
                <dt className="text-xs text-surface-400">Joined</dt>
                <dd className="text-sm font-medium text-surface-800">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-surface-400 mt-0.5" />
              <div>
                <dt className="text-xs text-surface-400">Last Login</dt>
                <dd className="text-sm font-medium text-surface-800">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleString()
                    : 'Never'}
                </dd>
              </div>
            </div>
          </dl>
        </motion.div>

        {/* Admin Actions */}
        <motion.div
          variants={fadeIn}
          className="rounded-xl border border-surface-200 bg-white shadow-card p-6"
        >
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4">
            Admin Actions
          </h2>

          {updateMutation.isSuccess && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              User updated successfully.
            </div>
          )}
          {updateMutation.isError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              Failed to update user.
            </div>
          )}

          <div className="space-y-5">
            {/* Change Role */}
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5">
                Change Role
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {allRoles.map((r) => (
                    <option key={r} value={r}>{roleLabel[r]}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveRole}
                  disabled={selectedRole === user.role || updateMutation.isPending}
                  className="bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Change Status */}
            <div>
              <label className="block text-xs font-medium text-surface-600 mb-1.5">
                Change Status
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
                  className="flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {allStatuses.map((s) => (
                    <option key={s} value={s}>{statusLabel[s]}</option>
                  ))}
                </select>
                <button
                  onClick={handleSaveStatus}
                  disabled={selectedStatus === user.status || updateMutation.isPending}
                  className="bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
            {/* Delete User */}
            <div className="border-t border-surface-200 pt-5">
              <p className="text-xs font-medium text-red-600 mb-1.5">
                Danger Zone
              </p>
              <p className="text-xs text-surface-500 mb-3">
                Permanently delete this user and all their data including businesses, inquiries, reviews, and notifications. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={user.role === 'system_admin'}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete User
              </button>
              {user.role === 'system_admin' && (
                <p className="text-xs text-surface-400 mt-1.5">
                  System admin accounts cannot be deleted. Demote the user first.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          deleteMutation.mutate()
          setShowDeleteConfirm(false)
        }}
        title="Permanently Delete User"
        message={`Are you sure you want to permanently delete ${user.firstName} ${user.lastName} (${user.email})? This will remove their account and ALL associated data including businesses, inquiries, reviews, and notifications. This action CANNOT be undone.`}
        confirmLabel="Yes, permanently delete"
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      />

      {deleteMutation.isError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-elevated">
          Failed to delete user. {(deleteMutation.error as Error)?.message || 'Please try again.'}
        </div>
      )}
    </motion.div>
  )
}
