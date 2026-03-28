import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { businessesApi } from '@/api/businesses'
import ConfirmModal from '@/components/ConfirmModal'
import type { BusinessListItem } from '@/api/businesses'
import type { BusinessStatus } from '@/api/types'
import {
  Plus,
  Store,
  Pencil,
  Send,
  Archive,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const STATUS_CONFIG: Record<
  BusinessStatus,
  { label: string; className: string }
> = {
  draft: {
    label: 'Draft',
    className: 'bg-surface-100 text-surface-600',
  },
  pending_review: {
    label: 'Pending Review',
    className: 'bg-amber-50 text-amber-700',
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-50 text-emerald-700',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-red-50 text-red-700',
  },
  archived: {
    label: 'Archived',
    className: 'bg-surface-100 text-surface-500',
  },
}

export default function MyListings() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'archive' | 'reactivate'; listing: BusinessListItem } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const res = await businessesApi.getMine()
      return res.data
    },
  })

  const submitMutation = useMutation({
    mutationFn: (id: string) => businessesApi.submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      showToast('success', 'Listing submitted for review.')
    },
    onError: () => showToast('error', 'Failed to submit listing. Please try again.'),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) => businessesApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      showToast('success', 'Listing archived.')
    },
    onError: () => showToast('error', 'Failed to archive listing. Please try again.'),
  })

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => businessesApi.reactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      showToast('success', 'Listing reactivated.')
    },
    onError: () => showToast('error', 'Failed to reactivate listing. Please try again.'),
  })

  const isMutating =
    submitMutation.isPending || archiveMutation.isPending || reactivateMutation.isPending

  const canCreateNew = !listings || listings.length < 5

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-surface-200 rounded-lg" />
          <div className="h-4 w-72 bg-surface-100 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-surface-200 rounded-xl p-6 space-y-3">
                <div className="h-5 w-40 bg-surface-200 rounded" />
                <div className="h-4 w-24 bg-surface-100 rounded" />
                <div className="h-4 w-full bg-surface-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-red-700">Failed to load your listings. Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-elevated transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Listings</h1>
          <p className="mt-1 text-sm text-surface-500">
            Manage your business listings on the portal.
          </p>
        </div>
        <Link
          to="/dashboard/listings/new"
          className={`inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors ${
            !canCreateNew ? 'opacity-50 pointer-events-none' : ''
          }`}
          aria-disabled={!canCreateNew}
          tabIndex={canCreateNew ? 0 : -1}
          onClick={(e) => { if (!canCreateNew) e.preventDefault() }}
        >
          <Plus className="h-4 w-4" />
          New Listing
        </Link>
      </div>

      {!canCreateNew && (
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          You have reached the maximum of 5 listings.
        </div>
      )}

      {/* Empty state */}
      {listings && listings.length === 0 ? (
        <div className="bg-white border border-surface-200 rounded-xl p-12 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
            <Store className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-2">No listings yet</h3>
          <p className="text-sm text-surface-500 mb-6 max-w-sm mx-auto">
            Add your business to the Yamacraw directory so residents and visitors can find you.
          </p>
          <Link
            to="/dashboard/listings/new"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create your first listing
          </Link>
        </div>
      ) : (
        /* Listing cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings?.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onSubmit={() => submitMutation.mutate(listing.id)}
              onArchive={() => setConfirmAction({ type: 'archive', listing })}
              onReactivate={() => setConfirmAction({ type: 'reactivate', listing })}
              disabled={isMutating}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (!confirmAction) return
          if (confirmAction.type === 'archive') {
            archiveMutation.mutate(confirmAction.listing.id)
          } else {
            reactivateMutation.mutate(confirmAction.listing.id)
          }
          setConfirmAction(null)
        }}
        title={confirmAction?.type === 'archive' ? 'Archive Listing' : 'Reactivate Listing'}
        message={
          confirmAction?.type === 'archive'
            ? `Are you sure you want to archive "${confirmAction.listing.name}"? It will be removed from the public directory until you reactivate it.`
            : `Are you sure you want to reactivate "${confirmAction?.listing.name}"? It will be visible in the public directory again.`
        }
        confirmLabel={confirmAction?.type === 'archive' ? 'Yes, archive it' : 'Yes, reactivate it'}
        confirmVariant={confirmAction?.type === 'archive' ? 'warning' : 'primary'}
        loading={archiveMutation.isPending || reactivateMutation.isPending}
      />
    </div>
  )
}

function ListingCard({
  listing,
  onSubmit,
  onArchive,
  onReactivate,
  disabled,
}: {
  listing: BusinessListItem
  onSubmit: () => void
  onArchive: () => void
  onReactivate: () => void
  disabled: boolean
}) {
  const status = listing.status as BusinessStatus
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft

  return (
    <div className="bg-white border border-surface-200 rounded-xl p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-surface-900 truncate">{listing.name}</h3>
          {listing.category && (
            <p className="text-xs text-surface-400 mt-0.5">{listing.category}</p>
          )}
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
        >
          {config.label}
        </span>
      </div>

      {listing.shortDescription && (
        <p className="text-sm text-surface-600 line-clamp-2 mb-4">{listing.shortDescription}</p>
      )}

      {/* Rejection reason */}
      {status === 'rejected' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>This listing was rejected. Edit and resubmit to get approved.</span>
        </div>
      )}

      {status === 'suspended' && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>This listing has been suspended. Contact an admin for details.</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-surface-100">
        <Link
          to={`/dashboard/listings/${listing.id}/edit`}
          className="inline-flex items-center gap-1.5 border border-surface-300 text-surface-700 hover:bg-surface-50 font-medium py-2 px-3.5 rounded-lg text-xs transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>

        {status === 'draft' && (
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3.5 rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            Submit for Review
          </button>
        )}

        {status === 'rejected' && (
          <Link
            to={`/dashboard/listings/${listing.id}/edit`}
            className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3.5 rounded-lg text-xs transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit & Resubmit
          </Link>
        )}

        {status === 'approved' && (
          <button
            onClick={onArchive}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 border border-surface-300 text-surface-700 hover:bg-surface-50 font-medium py-2 px-3.5 rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>
        )}

        {status === 'archived' && (
          <button
            onClick={onReactivate}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-3.5 rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reactivate
          </button>
        )}
      </div>
    </div>
  )
}
