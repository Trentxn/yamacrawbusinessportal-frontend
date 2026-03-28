import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, XCircle, CheckCircle2, Loader2,
  Mail, Phone, User, Calendar, MessageSquare,
  Lock, Building2, RotateCcw, ChevronDown,
  Flag, ShieldAlert,
} from 'lucide-react'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { useAuth } from '@/contexts/AuthContext'
import client from '@/api/client'
import type { ServiceRequestStatus, InquiryMessage } from '@/api/types'

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ServiceRequestStatus, { label: string; className: string }> = {
  open:    { label: 'Open',    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  read:    { label: 'Read',    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  replied: { label: 'Replied', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  closed:  { label: 'Closed',  className: 'bg-surface-100 text-surface-500 ring-1 ring-surface-200' },
  spam:    { label: 'Spam',    className: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
}

function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  const { label, className } = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'bg-surface-100 text-surface-500 ring-1 ring-surface-200',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}>
      {label}
    </span>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface Toast { type: 'success' | 'error'; message: string }

function ToastBanner({ toast }: { toast: Toast }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`fixed top-5 right-5 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-elevated ${
        toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {toast.type === 'success'
        ? <CheckCircle2 className="h-4 w-4 shrink-0" />
        : <XCircle className="h-4 w-4 shrink-0" />}
      {toast.message}
    </motion.div>
  )
}

// ─── Admin close reasons ─────────────────────────────────────────────────────

const ADMIN_CLOSE_REASONS = [
  'Resolved',
  'Policy violation',
  'Spam / fraudulent',
  'Duplicate inquiry',
  'Inappropriate content',
  'Other',
] as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function isWithin24Hours(iso: string | null): boolean {
  if (!iso) return false
  const diff = Date.now() - new Date(iso).getTime()
  return diff >= 0 && diff < 24 * 60 * 60 * 1000
}

// ─── Message bubble (admin third-party observer view) ────────────────────────

function MessageBubble({ msg }: { msg: InquiryMessage }) {
  const isBusiness = msg.senderRole === 'business_owner'
  const isAdmin = msg.senderRole === 'admin' || msg.senderRole === 'system_admin'
  const bgClass = isBusiness
    ? 'bg-primary-50 border border-primary-200 text-surface-800'
    : isAdmin
      ? 'bg-amber-50 border border-amber-200 text-surface-800'
      : 'bg-surface-50 border border-surface-200 text-surface-800'

  return (
    <div className="flex justify-start">
      <div className={`max-w-[85%] rounded-xl px-4 py-3 ${bgClass}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-surface-600">
            {msg.senderName}
          </span>
          <span className="text-[11px] text-surface-400">
            {formatDate(msg.createdAt)}
          </span>
          {isBusiness && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-primary-500">
              Business
            </span>
          )}
          {isAdmin && (
            <span className="text-[10px] font-medium uppercase tracking-wider text-amber-600">
              Admin
            </span>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {msg.body}
        </p>
      </div>
    </div>
  )
}

// ─── Loading skeleton ────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 w-28 bg-surface-100 rounded" />
      <div className="h-7 w-2/3 bg-surface-100 rounded" />
      <div className="flex gap-3">
        <div className="h-5 w-20 bg-surface-100 rounded-full" />
        <div className="h-5 w-36 bg-surface-100 rounded" />
        <div className="h-5 w-40 bg-surface-100 rounded" />
      </div>
      <div className="h-px bg-surface-100" />
      <div className="h-32 bg-surface-100 rounded-lg" />
    </div>
  )
}

// ─── Close modal ─────────────────────────────────────────────────────────────

function CloseModal({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const finalReason =
    selectedReason === 'Other' ? customReason.trim() : selectedReason
  const canConfirm =
    selectedReason !== '' && (selectedReason !== 'Other' || customReason.trim() !== '')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="bg-white rounded-xl shadow-elevated w-full max-w-md"
      >
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
          <h3 className="text-base font-semibold text-surface-900">Close Inquiry</h3>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-600 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label htmlFor="close-reason" className="block text-sm font-medium text-surface-700 mb-1.5">
              Reason for closing
            </label>
            <div className="relative">
              <select
                id="close-reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full appearance-none rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 pr-10 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
              >
                <option value="" disabled>Select a reason...</option>
                {ADMIN_CLOSE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            </div>
          </div>

          <AnimatePresence>
            {selectedReason === 'Other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <label htmlFor="custom-reason" className="block text-sm font-medium text-surface-700 mb-1.5">
                  Please describe
                </label>
                <input
                  id="custom-reason"
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Your reason..."
                  className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
                  maxLength={200}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-100 px-5 py-4">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(finalReason)}
            disabled={!canConfirm || isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Closing...' : 'Close Inquiry'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Flag modal ──────────────────────────────────────────────────────────────

function FlagModal({
  onClose,
  onConfirm,
  isPending,
}: {
  onClose: () => void
  onConfirm: (reason: string) => void
  isPending: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="bg-white rounded-xl shadow-elevated w-full max-w-md"
      >
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
          <h3 className="text-base font-semibold text-surface-900">Flag Inquiry</h3>
          <button
            onClick={onClose}
            className="text-surface-400 hover:text-surface-600 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <label htmlFor="flag-reason" className="block text-sm font-medium text-surface-700 mb-1.5">
            Why are you flagging this inquiry?
          </label>
          <textarea
            id="flag-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onPaste={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            rows={3}
            placeholder="Describe the issue..."
            className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
            maxLength={500}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-100 px-5 py-4">
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim() || isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Flagging...' : 'Flag Inquiry'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminInquiryDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()

  const backPath = location.pathname.startsWith('/system') ? '/system/inquiries' : '/admin/inquiries'

  const [toast, setToast] = useState<Toast | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const { data: inquiry, isLoading, isError } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: () => serviceRequestsApi.getById(id!).then(r => r.data),
    enabled: Boolean(id),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inquiry?.messages?.length])

  const closeMutation = useMutation({
    mutationFn: (reason: string) => serviceRequestsApi.close(id!, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', id] })
      setShowCloseModal(false)
      showToast('success', 'Inquiry closed.')
    },
    onError: () => showToast('error', 'Failed to close inquiry. Please try again.'),
  })

  const reopenMutation = useMutation({
    mutationFn: () => serviceRequestsApi.reopen(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', id] })
      showToast('success', 'Inquiry reopened.')
    },
    onError: () => showToast('error', 'Failed to reopen inquiry. Please try again.'),
  })

  const flagMutation = useMutation({
    mutationFn: (reason: string) => client.post(`/service-requests/${id}/flag`, { reason }),
    onSuccess: () => {
      setShowFlagModal(false)
      showToast('success', 'Inquiry flagged for review.')
    },
    onError: () => showToast('error', 'Failed to flag inquiry.'),
  })

  const isActive = inquiry && inquiry.status !== 'closed' && inquiry.status !== 'spam'

  const canReopen =
    inquiry?.status === 'closed' &&
    inquiry.closedBy === user?.id &&
    isWithin24Hours(inquiry.closedAt) &&
    (inquiry.reopenCount ?? 0) < 1

  // Build the unified conversation: original message first, then thread messages
  const allMessages: InquiryMessage[] = inquiry
    ? [
        {
          id: '__original__',
          senderId: inquiry.userId,
          senderRole: 'sender',
          senderName: inquiry.senderName,
          body: inquiry.message,
          createdAt: inquiry.createdAt,
        },
        ...inquiry.messages,
      ]
    : []

  return (
    <>
      <AnimatePresence>
        {toast && <ToastBanner toast={toast} />}
      </AnimatePresence>

      <AnimatePresence>
        {showCloseModal && (
          <CloseModal
            onClose={() => setShowCloseModal(false)}
            onConfirm={(reason) => closeMutation.mutate(reason)}
            isPending={closeMutation.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFlagModal && (
          <FlagModal
            onClose={() => setShowFlagModal(false)}
            onConfirm={(reason) => flagMutation.mutate(reason)}
            isPending={flagMutation.isPending}
          />
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto py-10 px-6">
        {/* Back link */}
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          All Inquiries
        </Link>

        {isLoading && <Skeleton />}

        {isError && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-5 py-4 text-sm">
            Failed to load this inquiry. Please try again or go back to the
            inquiries list.
          </div>
        )}

        {!isLoading && !isError && !inquiry && (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">Inquiry not found.</p>
            <Link
              to={backPath}
              className="text-primary-600 hover:underline text-sm mt-2 inline-block"
            >
              Back to inquiries
            </Link>
          </div>
        )}

        {inquiry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' as const }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-surface-900 leading-snug mb-3">
                {inquiry.subject}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-surface-500">
                <StatusBadge status={inquiry.status} />

                {inquiry.businessName && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-surface-600">
                    <Building2 className="w-3.5 h-3.5" />
                    {inquiry.businessName}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-surface-400" />
                  {formatDate(inquiry.createdAt)}
                </span>
              </div>
            </div>

            {/* Sender info card */}
            <div className="bg-white border border-surface-200 rounded-xl shadow-card px-5 py-4">
              <h2 className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">
                Sender Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-surface-700">
                  <User className="w-4 h-4 text-surface-400 shrink-0" />
                  <span>{inquiry.senderName}</span>
                </div>
                <div className="flex items-center gap-2 text-surface-700">
                  <Mail className="w-4 h-4 text-surface-400 shrink-0" />
                  <span className="truncate">{inquiry.senderEmail}</span>
                </div>
                {inquiry.senderPhone && (
                  <div className="flex items-center gap-2 text-surface-700">
                    <Phone className="w-4 h-4 text-surface-400 shrink-0" />
                    <span>{inquiry.senderPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Closed info */}
            {inquiry.status === 'closed' && (
              <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-500">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-surface-400" />
                  <span>
                    This inquiry was closed
                    {inquiry.closedByName && <> by <strong className="text-surface-700">{inquiry.closedByName}</strong></>}
                    {inquiry.closedAt && <> on {formatDate(inquiry.closedAt)}</>}
                  </span>
                </div>
                {inquiry.closeReason && (
                  <p className="mt-1.5 ml-6 text-xs text-surface-400 italic">
                    Reason: {inquiry.closeReason}
                  </p>
                )}
                {inquiry.reopenedByName && inquiry.reopenedAt && (
                  <div className="flex items-center gap-2 mt-2">
                    <RotateCcw className="h-4 w-4 text-surface-400" />
                    <span>
                      Reopened by <strong className="text-surface-700">{inquiry.reopenedByName}</strong> on {formatDate(inquiry.reopenedAt)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Admin action buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {isActive && (
                <button
                  onClick={() => setShowCloseModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-sm font-medium text-surface-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Close Inquiry
                </button>
              )}

              {canReopen && (
                <button
                  onClick={() => reopenMutation.mutate()}
                  disabled={reopenMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-sm font-medium text-surface-600 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  {reopenMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RotateCcw className="h-4 w-4" />}
                  {reopenMutation.isPending ? 'Reopening...' : 'Reopen'}
                </button>
              )}

              <button
                onClick={() => setShowFlagModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3.5 py-2 text-sm font-medium text-surface-600 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              >
                <Flag className="h-4 w-4" />
                Flag Inquiry
              </button>
            </div>

            <hr className="border-surface-200" />

            {/* Conversation */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-surface-400" />
                <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wide">
                  Conversation ({allMessages.length})
                </h2>
              </div>

              {/* Suspicious link warning */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-sm text-amber-700 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Be cautious of suspicious links in conversations. Never share personal or financial information.</span>
              </div>

              <div className="bg-white border border-surface-200 rounded-xl shadow-card px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto">
                {allMessages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </section>

            {inquiry.messages.length === 0 && isActive && (
              <p className="text-xs text-surface-400 italic">
                No replies yet. The original message is shown above.
              </p>
            )}
          </motion.div>
        )}
      </div>
    </>
  )
}
