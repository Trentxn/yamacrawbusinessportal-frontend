import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Tag,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldOff,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import ConfirmModal from '@/components/ConfirmModal'
import type { BusinessStatus } from '@/api/types'

const statusConfig: Record<
  BusinessStatus,
  { label: string; bg: string; text: string }
> = {
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-800' },
  pending_review: {
    label: 'Pending Review',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
  },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' },
  draft: { label: 'Draft', bg: 'bg-surface-100', text: 'text-surface-600' },
  suspended: {
    label: 'Suspended',
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
  archived: {
    label: 'Archived',
    bg: 'bg-surface-100',
    text: 'text-surface-500',
  },
}

const DAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export default function AdminBusinessDetail() {
  const basePath = useAdminBasePath()
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [showUnsuspendConfirm, setShowUnsuspendConfirm] = useState(false)
  const [reason, setReason] = useState('')

  const { data: business, isLoading, isError } = useQuery({
    queryKey: ['admin', 'business', id],
    queryFn: () => adminApi.getBusinessDetail(id!).then((r) => r.data),
    enabled: !!id,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'business', id] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'businesses'] })
  }

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveBusiness(id!),
    onSuccess: invalidate,
  })

  const rejectMutation = useMutation({
    mutationFn: (rejectionReason: string) =>
      adminApi.rejectBusiness(id!, rejectionReason),
    onSuccess: () => {
      setShowRejectModal(false)
      setReason('')
      invalidate()
    },
  })

  const suspendMutation = useMutation({
    mutationFn: (suspendReason: string) =>
      adminApi.suspendBusiness(id!, suspendReason),
    onSuccess: () => {
      setShowSuspendModal(false)
      setReason('')
      invalidate()
    },
  })

  const unsuspendMutation = useMutation({
    mutationFn: () => adminApi.unsuspendBusiness(id!),
    onSuccess: invalidate,
  })

  const featureMutation = useMutation({
    mutationFn: (featured: boolean) => adminApi.featureBusiness(id!, featured),
    onSuccess: invalidate,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-surface-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading business details...
      </div>
    )
  }

  if (isError || !business) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <p className="text-surface-600 mb-4">
          Could not load business details.
        </p>
        <Link
          to={`${basePath}/businesses`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to business list
        </Link>
      </div>
    )
  }

  const sc = statusConfig[business.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-4xl mx-auto py-10 px-6"
    >
      {/* Back link */}
      <Link
        to={`${basePath}/businesses`}
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to All Businesses
      </Link>

      {/* Status bar */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${sc.bg} ${sc.text}`}
          >
            {sc.label}
          </span>
          {business.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-3 py-1 text-sm font-medium text-accent-700">
              <Star className="h-3.5 w-3.5 fill-accent-400" />
              Featured
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {business.status === 'pending_review' && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="inline-flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
          {business.status === 'approved' && (
            <>
              <button
                onClick={() => setShowSuspendModal(true)}
                className="inline-flex items-center gap-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium"
              >
                <ShieldOff className="h-4 w-4" />
                Suspend
              </button>
              <button
                onClick={() =>
                  featureMutation.mutate(!business.isFeatured)
                }
                disabled={featureMutation.isPending}
                className="inline-flex items-center gap-1.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                <Star className="h-4 w-4" />
                {business.isFeatured ? 'Unfeature' : 'Feature'}
              </button>
            </>
          )}
          {business.status === 'suspended' && (
            <button
              onClick={() => setShowUnsuspendConfirm(true)}
              disabled={unsuspendMutation.isPending}
              className="inline-flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {unsuspendMutation.isPending ? 'Restoring...' : 'Unsuspend'}
            </button>
          )}
        </div>
      </div>

      {/* Rejection reason banner */}
      {business.status === 'rejected' && business.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
          <p className="text-sm font-medium text-red-800 mb-1">
            Rejection Reason
          </p>
          <p className="text-sm text-red-700">{business.rejectionReason}</p>
        </div>
      )}

      {/* Main details */}
      <div className="rounded-xl border border-surface-200 bg-white shadow-card overflow-hidden mb-6">
        {/* Header */}
        <div className="p-6 border-b border-surface-100 flex items-start gap-5">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt=""
              className="h-16 w-16 rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 text-primary-600 flex-shrink-0">
              <span className="text-2xl font-bold">
                {business.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-surface-900 mb-1">
              {business.name}
            </h1>
            {business.category && (
              <p className="text-sm text-surface-500">{business.category.name}</p>
            )}
            {business.shortDescription && (
              <p className="text-sm text-surface-600 mt-1">
                {business.shortDescription}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <div className="p-6 border-b border-surface-100">
            <h2 className="text-sm font-medium uppercase tracking-wider text-surface-500 mb-2">
              Description
            </h2>
            <p className="text-surface-700 whitespace-pre-line">
              {business.description}
            </p>
          </div>
        )}

        {/* Contact & Address */}
        <div className="p-6 border-b border-surface-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-surface-500 mb-3">
              Contact
            </h2>
            <ul className="space-y-2 text-sm text-surface-700">
              {business.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-surface-400" />
                  {business.phone}
                </li>
              )}
              {business.email && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-surface-400" />
                  {business.email}
                </li>
              )}
              {business.website && (
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-surface-400" />
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline inline-flex items-center gap-1"
                  >
                    {business.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wider text-surface-500 mb-3">
              Address
            </h2>
            <div className="flex items-start gap-2 text-sm text-surface-700">
              <MapPin className="h-4 w-4 text-surface-400 mt-0.5 flex-shrink-0" />
              <div>
                {business.addressLine1 && <p>{business.addressLine1}</p>}
                {business.addressLine2 && <p>{business.addressLine2}</p>}
                <p>
                  {[business.settlement, business.island]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        {business.operatingHours &&
          Object.keys(business.operatingHours).length > 0 && (
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-sm font-medium uppercase tracking-wider text-surface-500 mb-3">
                <Clock className="inline h-4 w-4 mr-1 -mt-0.5" />
                Operating Hours
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                {DAY_ORDER.map((day) => {
                  const hours = business.operatingHours?.[day] ?? business.operatingHours?.[day.toLowerCase()]
                  return (
                    <div key={day} className="flex flex-col">
                      <span className="text-surface-500 capitalize text-xs font-medium">
                        {day}
                      </span>
                      <span className="text-surface-700">
                        {!hours || typeof hours === 'string'
                          ? 'Closed'
                          : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        {/* Social Links */}
        {business.socialLinks &&
          Object.keys(business.socialLinks).length > 0 && (
            <div className="p-6 border-b border-surface-100">
              <h2 className="text-sm font-medium uppercase tracking-wider text-surface-500 mb-3">
                Social Links
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(business.socialLinks).map(
                  ([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-sm text-surface-700 hover:border-primary-300 hover:text-primary-600 transition-colors"
                    >
                      <span className="capitalize">{platform}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ),
                )}
              </div>
            </div>
          )}

        {/* Tags */}
        {business.tags.length > 0 && (
          <div className="p-6 border-b border-surface-100">
            <h2 className="text-sm font-medium uppercase tracking-wider text-surface-500 mb-3">
              <Tag className="inline h-4 w-4 mr-1 -mt-0.5" />
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {business.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {business.photos.length > 0 && (
          <div className="p-6">
            <h2 className="text-sm font-medium uppercase tracking-wider text-surface-500 mb-3">
              Photos ({business.photos.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {business.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden bg-surface-100"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ''}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="text-xs text-surface-400 flex flex-wrap gap-4">
        <span>ID: {business.id}</span>
        {business.viewCount != null && (
          <span>Views: {business.viewCount.toLocaleString()}</span>
        )}
        <span>
          Created: {new Date(business.createdAt).toLocaleDateString()}
        </span>
        <span>
          Updated: {new Date(business.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 mx-4">
            <h3 className="text-lg font-semibold text-surface-900 mb-1">
              Reject Business
            </h3>
            <p className="text-sm text-surface-500 mb-4">
              Select a reason or provide a custom one. The owner will see
              this message.
            </p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
            >
              <option value="">Select a reason...</option>
              <option value="Incomplete or inaccurate business information">Incomplete or inaccurate business information</option>
              <option value="Description is too vague — please add services offered">Description is too vague — please add services offered</option>
              <option value="Business does not appear to operate in the Yamacraw area">Business does not appear to operate in the Yamacraw area</option>
              <option value="Listing contains inappropriate or misleading content">Listing contains inappropriate or misleading content</option>
              <option value="Duplicate listing — a similar listing already exists">Duplicate listing — a similar listing already exists</option>
              <option value="Contact information appears invalid">Contact information appears invalid</option>
              <option value="__other__">Other (specify below)</option>
            </select>
            <textarea
              rows={3}
              value={reason === '__other__' ? '' : reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Additional details or custom reason..."
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setReason('')
                }}
                className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMutation.mutate(reason)}
                disabled={!reason.trim() || rejectMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend Confirm */}
      <ConfirmModal
        open={showUnsuspendConfirm}
        onClose={() => setShowUnsuspendConfirm(false)}
        onConfirm={() => {
          unsuspendMutation.mutate()
          setShowUnsuspendConfirm(false)
        }}
        title="Unsuspend Business"
        message={`Are you sure you want to unsuspend "${business.name}"? This will restore the listing and make it publicly visible again.`}
        confirmLabel="Yes, unsuspend"
        confirmVariant="primary"
        loading={unsuspendMutation.isPending}
      />

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 mx-4">
            <h3 className="text-lg font-semibold text-surface-900 mb-1">
              Suspend Business
            </h3>
            <p className="text-sm text-surface-500 mb-4">
              Provide a reason for suspending this listing.
            </p>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Suspension reason..."
              className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowSuspendModal(false)
                  setReason('')
                }}
                className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50"
              >
                Cancel
              </button>
              <button
                onClick={() => suspendMutation.mutate(reason)}
                disabled={!reason.trim() || suspendMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
