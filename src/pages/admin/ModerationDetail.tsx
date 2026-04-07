import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Tag,
  ImageIcon,
  Loader2,
  User,
} from 'lucide-react'
import { adminApi } from '@/api/admin'
import type { BusinessStatus } from '@/api/types'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const STATUS_STYLES: Record<BusinessStatus, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending_review: 'bg-amber-100 text-amber-700',
  rejected: 'bg-red-100 text-red-700',
  draft: 'bg-surface-100 text-surface-600',
  suspended: 'bg-red-100 text-red-700',
  archived: 'bg-surface-100 text-surface-600',
}

const STATUS_LABELS: Record<BusinessStatus, string> = {
  approved: 'Approved',
  pending_review: 'Pending Review',
  rejected: 'Rejected',
  draft: 'Draft',
  suspended: 'Suspended',
  archived: 'Archived',
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ModerationDetail() {
  const basePath = useAdminBasePath()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: business, isLoading, error } = useQuery({
    queryKey: ['admin', 'business', id],
    queryFn: () => adminApi.getBusinessDetail(id!).then((r) => r.data),
    enabled: !!id,
  })

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveBusiness(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'business', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => adminApi.rejectBusiness(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'business', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      setShowRejectForm(false)
      setRejectionReason('')
    },
  })

  const handleReject = () => {
    if (!rejectionReason.trim()) return
    rejectMutation.mutate(rejectionReason.trim())
  }

  const isPending = business?.status === 'pending_review'
  const isMutating = approveMutation.isPending || rejectMutation.isPending

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 rounded bg-surface-100" />
          <div className="h-8 w-72 rounded bg-surface-100" />
          <div className="h-64 rounded-xl bg-surface-100" />
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-6 text-center">
        <p className="text-surface-500 mb-4">Unable to load business details.</p>
        <Link
          to={`${basePath}/moderation`}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Back to Moderation Queue
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
    >
      {/* Back link */}
      <motion.div variants={fadeIn} className="mb-6">
        <button
          onClick={() => navigate(`${basePath}/moderation`)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Moderation Queue
        </button>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeIn} className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt=""
              className="h-14 w-14 rounded-xl object-cover"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
              {business.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{business.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[business.status]}`}
              >
                {STATUS_LABELS[business.status]}
              </span>
              {business.category && (
                <span className="text-sm text-surface-400">{business.category.name}</span>
              )}
            </div>
            {(business.ownerFirstName || business.ownerLastName) && (
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-surface-500">
                <User className="h-3.5 w-3.5" />
                Submitted by {business.ownerFirstName} {business.ownerLastName}
              </div>
            )}
          </div>
        </div>

        {business.isFeatured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 text-accent-700 px-2.5 py-0.5 text-xs font-semibold">
            Featured
          </span>
        )}
      </motion.div>

      {/* Rejection reason banner */}
      {business.status === 'rejected' && business.rejectionReason && (
        <motion.div
          variants={fadeIn}
          className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6"
        >
          <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason</p>
          <p className="text-sm text-red-600">{business.rejectionReason}</p>
        </motion.div>
      )}

      {/* Details card */}
      <motion.div
        variants={fadeIn}
        className="rounded-xl border border-surface-200 bg-white shadow-card p-6 mb-6 space-y-6"
      >
        {/* Description */}
        {business.description && (
          <div>
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-surface-700 whitespace-pre-line">{business.description}</p>
          </div>
        )}

        {business.shortDescription && (
          <div>
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-2">
              Short Description
            </h3>
            <p className="text-surface-600">{business.shortDescription}</p>
          </div>
        )}

        {/* Contact info */}
        <div>
          <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">
            Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {business.phone && (
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <Phone className="h-4 w-4 text-surface-400" />
                {business.phone}
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <Mail className="h-4 w-4 text-surface-400" />
                {business.email}
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <Globe className="h-4 w-4 text-surface-400" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline truncate"
                >
                  {business.website}
                </a>
              </div>
            )}
            {(business.addressLine1 || business.settlement || business.island) && (
              <div className="flex items-start gap-2 text-sm text-surface-600">
                <MapPin className="h-4 w-4 text-surface-400 mt-0.5" />
                <span>
                  {[business.addressLine1, business.addressLine2, business.settlement, business.island]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Operating Hours */}
        {business.operatingHours && Object.keys(business.operatingHours).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Operating Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DAY_ORDER.map((day) => {
                const hours = business.operatingHours?.[day] ?? business.operatingHours?.[day.toLowerCase()]
                return (
                  <div key={day} className="flex justify-between text-sm py-1 px-2 rounded hover:bg-surface-50">
                    <span className="text-surface-600 capitalize font-medium">{day}</span>
                    <span className="text-surface-400">
                      {hours && typeof hours === 'object' ? `${hours.open} - ${hours.close}` : 'Closed'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {business.tags && business.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {business.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-surface-100 text-surface-600 px-3 py-1 text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Logo */}
        {business.logoUrl && (
          <div>
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">
              Logo
            </h3>
            <img
              src={business.logoUrl}
              alt={`${business.name} logo`}
              className="h-28 w-28 rounded-xl object-cover border border-surface-200"
            />
          </div>
        )}

        {/* Photos */}
        {business.photos && business.photos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Photos ({business.photos.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {business.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ''}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {photo.caption && (
                    <p className="text-xs text-surface-500 mt-1 truncate">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {business.socialLinks && Object.keys(business.socialLinks).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">
              Social Links
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(business.socialLinks).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-50 border border-surface-200 px-3 py-1.5 text-sm text-surface-600 hover:bg-surface-100 transition-colors capitalize"
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div variants={fadeIn}>
        {isPending ? (
          <div className="rounded-xl border border-surface-200 bg-white shadow-card p-6">
            <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">
              Moderation Actions
            </h3>

            {approveMutation.isSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-4 text-sm text-emerald-700 font-medium">
                Business approved successfully.
              </div>
            )}

            {rejectMutation.isSuccess && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700 font-medium">
                Business rejected.
              </div>
            )}

            {(approveMutation.isError || rejectMutation.isError) && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700">
                An error occurred. Please try again.
              </div>
            )}

            {!showRejectForm ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => approveMutation.mutate()}
                  disabled={isMutating}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-5 py-2.5 font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isMutating}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-5 py-2.5 font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-medium text-surface-700">Rejection Reason</span>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejecting this listing..."
                    rows={3}
                    className="mt-1 block w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition"
                  />
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || isMutating}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-5 py-2.5 font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {rejectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectionReason('')
                    }}
                    disabled={isMutating}
                    className="rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-surface-200 bg-white shadow-card p-6 text-center">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLES[business.status]}`}
            >
              {STATUS_LABELS[business.status]}
            </span>
            <p className="text-sm text-surface-400 mt-2">
              This listing has already been {business.status.replace('_', ' ')}.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
