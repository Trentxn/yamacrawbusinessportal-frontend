import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Store,
  MessageSquare,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  Inbox,
} from 'lucide-react'
import { businessesApi } from '@/api/businesses'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { useAuth } from '@/contexts/AuthContext'
import type { BusinessStatus, ServiceRequestStatus } from '@/api/types'

// ─── Status configs ──────────────────────────────────────────────────────────

const BUSINESS_STATUS_CONFIG: Record<BusinessStatus, { label: string; className: string }> = {
  draft:          { label: 'Draft',          className: 'bg-surface-100 text-surface-600' },
  pending_review: { label: 'Pending',        className: 'bg-amber-50 text-amber-700' },
  approved:       { label: 'Approved',       className: 'bg-emerald-50 text-emerald-700' },
  rejected:       { label: 'Rejected',       className: 'bg-red-50 text-red-700' },
  suspended:      { label: 'Suspended',      className: 'bg-red-50 text-red-700' },
  archived:       { label: 'Archived',       className: 'bg-surface-100 text-surface-500' },
}

const INQUIRY_STATUS_BADGE: Record<ServiceRequestStatus, string> = {
  open:    'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  read:    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  replied: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  closed:  'bg-surface-100 text-surface-500 ring-1 ring-inset ring-surface-200',
  spam:    'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
}

const INQUIRY_STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  open:    'Open',
  read:    'Read',
  replied: 'Replied',
  closed:  'Closed',
  spam:    'Spam',
}

const LISTING_TYPE_LABEL: Record<string, string> = {
  business:   'Business',
  contractor: 'Contractor',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OwnerOverview() {
  const { user } = useAuth()
  const isContractor = user?.role === 'contractor'

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const res = await businessesApi.getMine()
      return res.data
    },
  })

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ['received-inquiries-overview'],
    queryFn: async () => {
      const res = await serviceRequestsApi.listReceived({ pageSize: 100 })
      return res.data
    },
  })

  const isLoading = listingsLoading || inquiriesLoading

  const totalListings = listings?.length ?? 0
  const approvedListings = listings?.filter((l) => l.status === 'approved').length ?? 0
  const totalInquiries = inquiriesData?.total ?? 0
  const pendingInquiries = inquiriesData?.items.filter((i) => i.status === 'open').length ?? 0
  const recentListings = listings?.slice(0, 3) ?? []
  const recentInquiries = inquiriesData?.items.slice(0, 5) ?? []

  const stats = [
    { label: isContractor ? 'Total Services' : 'Total Listings', value: totalListings, icon: Store, color: 'text-primary-600 bg-primary-50' },
    { label: isContractor ? 'Client Inquiries' : 'Total Inquiries', value: totalInquiries, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending Inquiries',   value: pendingInquiries, icon: Clock,         color: 'text-amber-600 bg-amber-50' },
    { label: isContractor ? 'Approved Services' : 'Approved Listings', value: approvedListings, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  ]

  // ─── Loading skeleton ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="animate-pulse space-y-8">
          <div>
            <div className="h-7 w-56 bg-surface-200 rounded-lg mb-2" />
            <div className="h-4 w-72 bg-surface-100 rounded" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-surface-200 rounded-xl p-5">
                <div className="h-10 w-10 bg-surface-100 rounded-lg mb-3" />
                <div className="h-7 w-12 bg-surface-200 rounded mb-1" />
                <div className="h-4 w-24 bg-surface-100 rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-surface-200 rounded-xl p-6">
            <div className="h-5 w-32 bg-surface-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-100 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      {/* Header */}
      <motion.div {...fadeUp} className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          {isContractor
            ? 'Here is a snapshot of your services and client inquiries.'
            : 'Here is a snapshot of your listings and inquiries.'}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-surface-200 rounded-xl p-5 shadow-card"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color} mb-3`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
            <p className="text-xs text-surface-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.1 }}
        className="flex items-center gap-3 mb-8"
      >
        <Link
          to="/dashboard/listings/new"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          {isContractor ? 'Add New Service' : 'Create New Listing'}
        </Link>
        <Link
          to="/dashboard/inquiries"
          className="inline-flex items-center gap-2 border border-surface-300 text-surface-700 hover:bg-surface-50 font-medium py-2.5 px-5 rounded-lg text-sm transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          {isContractor ? 'View Client Inquiries' : 'View Inquiries'}
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings Section */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="bg-white border border-surface-200 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-surface-900">{isContractor ? 'My Services' : 'My Listings'}</h2>
              {totalListings > 0 && (
                <Link
                  to="/dashboard/listings"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  {isContractor ? 'View All Services' : 'View All Listings'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="p-6">
              {recentListings.length === 0 ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
                    <Store className="h-7 w-7 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-surface-900 mb-1">Get Started</h3>
                  <p className="text-xs text-surface-500 mb-4 max-w-xs mx-auto">
                    {isContractor
                      ? 'Add your government contract services to the Yamacraw directory so residents can find and reach you.'
                      : 'Add your business to the Yamacraw directory so residents and visitors can find you.'}
                  </p>
                  <Link
                    to="/dashboard/listings/new"
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {isContractor ? 'Add Your First Service' : 'Create Your First Listing'}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentListings.map((listing) => {
                    const status = listing.status as BusinessStatus
                    const statusConfig = BUSINESS_STATUS_CONFIG[status] || BUSINESS_STATUS_CONFIG.draft
                    return (
                      <Link
                        key={listing.id}
                        to={`/dashboard/listings/${listing.id}/edit`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-surface-200 px-4 py-3 hover:bg-surface-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-surface-900 truncate">
                            {listing.name}
                          </p>
                          {listing.category && (
                            <p className="text-xs text-surface-400 mt-0.5">{listing.category}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-surface-100 text-surface-600">
                            {LISTING_TYPE_LABEL[listing.listingType] || listing.listingType}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.className}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recent Inquiries Section */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, ease: 'easeOut' as const, delay: 0.2 }}
        >
          <div className="bg-white border border-surface-200 rounded-xl shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
              <h2 className="text-base font-semibold text-surface-900">Recent Inquiries</h2>
              {totalInquiries > 0 && (
                <Link
                  to="/dashboard/inquiries"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  View All
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            <div className="p-4">
              {recentInquiries.length === 0 ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100">
                    <Inbox className="h-6 w-6 text-surface-400" />
                  </div>
                  <p className="text-sm font-medium text-surface-600">No inquiries yet</p>
                  <p className="mt-1 text-xs text-surface-400">
                    Inquiries from customers will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentInquiries.map((inquiry) => (
                    <Link
                      key={inquiry.id}
                      to={`/dashboard/inquiries/${inquiry.id}`}
                      className="block rounded-lg px-3 py-2.5 hover:bg-surface-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-surface-900 truncate">
                          {inquiry.senderName}
                        </p>
                        <span
                          className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${INQUIRY_STATUS_BADGE[inquiry.status]}`}
                        >
                          {INQUIRY_STATUS_LABEL[inquiry.status]}
                        </span>
                      </div>
                      <p className="text-xs text-surface-600 truncate">{inquiry.subject}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-surface-400 truncate">
                          {inquiry.businessName}
                        </p>
                        <p className="text-xs text-surface-400 shrink-0">
                          {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
