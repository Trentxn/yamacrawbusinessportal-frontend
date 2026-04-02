import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Send,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
  Calendar,
  MessageSquare,
  Ban,
  Clock,
  Lock,
  Building2,
  RotateCcw,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmModal from '@/components/ConfirmModal'
import type { ServiceRequestStatus, InquiryMessage } from '@/api/types'

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ServiceRequestStatus, { label: string; className: string }> = {
  open:    { label: 'Open',    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
  read:    { label: 'Read',    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  replied: { label: 'Replied', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  closed:  { label: 'Closed',  className: 'bg-surface-100 text-surface-500 ring-1 ring-surface-200' },
  spam:    { label: 'Spam',    className: 'bg-red-50 text-red-600 ring-1 ring-red-200' },
}

function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface Toast { type: 'success' | 'error'; message: string }

function ToastBanner({ toast }: { toast: Toast }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-elevated ${
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

// ─── Close reasons ───────────────────────────────────────────────────────────

const CLOSE_REASONS = [
  'Resolved - inquiry answered',
  'Resolved - service provided',
  'Duplicate inquiry',
  'Spam / irrelevant',
  'Customer unresponsive',
  'Other',
] as const

// ─── Close modal ──────────────────────────────────────────────────────────────

function CloseModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const resolvedReason = selectedReason === 'Other'
    ? customReason.trim()
    : selectedReason

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-xl shadow-elevated p-6"
      >
        <h3 className="text-base font-semibold text-surface-900 mb-1">Close this inquiry?</h3>
        <p className="text-sm text-surface-500 mb-4">
          Select a reason for closing. The inquiry will be marked as closed and no further messages can be sent.
        </p>

        <div className="relative mb-4">
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="w-full appearance-none rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 pr-10 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
          >
            <option value="" disabled>Select a reason...</option>
            {CLOSE_REASONS.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
        </div>

        {selectedReason === 'Other' && (
          <input
            type="text"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Enter a custom reason..."
            className="w-full rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors mb-4"
          />
        )}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center gap-1.5 border border-surface-200 text-surface-700 hover:bg-surface-50 font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(resolvedReason)}
            disabled={loading || !selectedReason || (selectedReason === 'Other' && !customReason.trim())}
            className="inline-flex items-center gap-2 bg-surface-700 hover:bg-surface-800 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Close Inquiry
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmClassName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-white rounded-xl shadow-elevated p-6"
      >
        <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
        <p className="text-sm text-surface-500 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center gap-1.5 border border-surface-200 text-surface-700 hover:bg-surface-50 font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 ${confirmClassName}`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

function timeRemaining(iso: string | null): string | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h remaining`
  if (hours > 0) return `${hours}h remaining`
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${mins}m remaining`
}

function isWithin24Hours(iso: string | null): boolean {
  if (!iso) return false
  const diff = Date.now() - new Date(iso).getTime()
  return diff >= 0 && diff < 24 * 60 * 60 * 1000
}

// ─── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg, isOwner }: { msg: InquiryMessage; isOwner: boolean }) {
  return (
    <div className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 ${
          isOwner
            ? 'bg-primary-600 text-white'
            : 'bg-surface-50 border border-surface-200 text-surface-800'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${isOwner ? 'text-white/80' : 'text-surface-500'}`}>
            {msg.senderName}
          </span>
          <span className={`text-xs ${isOwner ? 'text-white/50' : 'text-surface-400'}`}>
            {formatDate(msg.createdAt)}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {msg.body}
        </p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InquiryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [messageText, setMessageText] = useState('')
  const [toast, setToast] = useState<Toast | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [confirmSpam, setConfirmSpam] = useState(false)
  const [showReopenConfirm, setShowReopenConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inquiry', id] })
    queryClient.invalidateQueries({ queryKey: ['received-inquiries'] })
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const { data: inquiry, isLoading, error } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: async () => {
      const res = await serviceRequestsApi.getById(id!)
      return res.data
    },
    enabled: !!id,
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [inquiry?.messages?.length])

  // ── Send message mutation ─────────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: () => serviceRequestsApi.addMessage(id!, messageText.trim()),
    onSuccess: () => {
      invalidate()
      setMessageText('')
      showToast('success', 'Message sent.')
    },
    onError: () => showToast('error', 'Failed to send message. Please try again.'),
  })

  // ── Close mutation ─────────────────────────────────────────────────────────

  const closeMutation = useMutation({
    mutationFn: (reason: string) => serviceRequestsApi.close(id!, reason || undefined),
    onSuccess: () => {
      invalidate()
      setShowCloseModal(false)
      showToast('success', 'Inquiry closed.')
    },
    onError: () => {
      setShowCloseModal(false)
      showToast('error', 'Failed to close inquiry. Please try again.')
    },
  })

  // ── Spam mutation ──────────────────────────────────────────────────────────

  const spamMutation = useMutation({
    mutationFn: () => serviceRequestsApi.markSpam(id!),
    onSuccess: () => {
      invalidate()
      setConfirmSpam(false)
      showToast('success', 'Inquiry marked as spam.')
      setTimeout(() => navigate('/dashboard/inquiries'), 1200)
    },
    onError: () => {
      setConfirmSpam(false)
      showToast('error', 'Failed to mark as spam. Please try again.')
    },
  })

  // ── Reopen mutation ────────────────────────────────────────────────────────

  const reopenMutation = useMutation({
    mutationFn: () => serviceRequestsApi.reopen(id!),
    onSuccess: () => {
      invalidate()
      showToast('success', 'Inquiry reopened.')
    },
    onError: () => showToast('error', 'Failed to reopen inquiry. Please try again.'),
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-4 w-32 bg-surface-200 rounded" />
          <div className="h-7 w-2/3 bg-surface-200 rounded-lg" />
          <div className="bg-white border border-surface-200 rounded-xl p-6 space-y-3 shadow-card">
            <div className="h-4 w-40 bg-surface-100 rounded" />
            <div className="h-4 w-56 bg-surface-100 rounded" />
            <div className="h-20 bg-surface-100 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !inquiry) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-6">
        <Link
          to="/dashboard/inquiries"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inquiries
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <XCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-700">Could not load this inquiry.</p>
          <p className="text-xs text-red-500 mt-1">It may have been removed or you don't have access.</p>
        </div>
      </div>
    )
  }

  const isActive = inquiry.status !== 'closed' && inquiry.status !== 'spam'
  const canSendMessage = isActive
  const canClose = isActive
  const canSpam = inquiry.status !== 'spam'
  const isMutating = sendMutation.isPending || closeMutation.isPending || spamMutation.isPending || reopenMutation.isPending
  const expiry = timeRemaining(inquiry.expiresAt)
  const isExpired = expiry === 'Expired'

  // Reopen eligibility: closed, within 24h, and closed by the current user
  const canReopen =
    inquiry.status === 'closed' &&
    isWithin24Hours(inquiry.closedAt) &&
    inquiry.closedBy === user?.id &&
    (inquiry.reopenCount ?? 0) < 1

  // Build unified conversation: original message first, then all thread messages
  const originalAsBubble: InquiryMessage = {
    id: '__original__',
    senderId: inquiry.userId,
    senderRole: 'sender',
    senderName: inquiry.senderName,
    body: inquiry.message,
    createdAt: inquiry.createdAt,
  }
  const allMessages = [originalAsBubble, ...(inquiry.messages ?? [])]

  return (
    <>
      {toast && <ToastBanner toast={toast} />}

      {showCloseModal && (
        <CloseModal
          onConfirm={(reason) => closeMutation.mutate(reason)}
          onCancel={() => setShowCloseModal(false)}
          loading={closeMutation.isPending}
        />
      )}

      {confirmSpam && (
        <ConfirmDialog
          title="Mark as spam?"
          description="This inquiry will be flagged as spam and you'll be redirected to the inbox. This action cannot be undone."
          confirmLabel="Mark as Spam"
          confirmClassName="bg-red-600 hover:bg-red-700 text-white"
          onConfirm={() => spamMutation.mutate()}
          onCancel={() => setConfirmSpam(false)}
          loading={spamMutation.isPending}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' as const }}
        className="max-w-3xl mx-auto py-10 px-6"
      >
        {/* Back link */}
        <Link
          to="/dashboard/inquiries"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Inquiries
        </Link>

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <StatusBadge status={inquiry.status} />
              {inquiry.businessName && (
                <span className="inline-flex items-center gap-1 text-xs text-surface-400">
                  <Building2 className="h-3 w-3" />
                  {inquiry.businessName}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-surface-900 leading-snug mt-1">
              {inquiry.subject}
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {canClose && (
              <button
                onClick={() => setShowCloseModal(true)}
                disabled={isMutating}
                title="Close inquiry"
                className="inline-flex items-center gap-1.5 border border-surface-200 text-surface-600 hover:bg-surface-50 font-medium py-2 px-3.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            )}
            {canSpam && (
              <button
                onClick={() => setConfirmSpam(true)}
                disabled={isMutating}
                title="Mark as spam"
                className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2 px-3.5 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                <span className="hidden sm:inline">Spam</span>
              </button>
            )}
          </div>
        </div>

        {/* Closed info bar with optional reopen */}
        {inquiry.status === 'closed' && (
          <div className="rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 mb-5 text-sm text-surface-500">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-surface-400" />
                <span>
                  This inquiry was closed
                  {inquiry.closedByName && <> by <strong className="text-surface-700">{inquiry.closedByName}</strong></>}
                  {inquiry.closedAt && <> on {formatDate(inquiry.closedAt)}</>}
                </span>
              </div>
              {canReopen && (
                <button
                  onClick={() => setShowReopenConfirm(true)}
                  disabled={isMutating}
                  className="inline-flex items-center gap-1.5 border border-primary-200 text-primary-600 hover:bg-primary-50 font-medium py-1.5 px-3 rounded-lg text-xs transition-colors disabled:opacity-50 shrink-0"
                >
                  {reopenMutation.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RotateCcw className="h-3.5 w-3.5" />}
                  Reopen
                </button>
              )}
            </div>
            {inquiry.closeReason && (
              <p className="mt-1.5 ml-6 text-xs text-surface-400 italic">
                Reason: {inquiry.closeReason}
              </p>
            )}
            {inquiry.reopenedByName && inquiry.reopenedAt && (
              <div className="flex items-center gap-2 mt-2 ml-6 text-sm text-surface-500">
                <RotateCcw className="h-4 w-4 text-surface-400" />
                <span>
                  Reopened by <strong className="text-surface-700">{inquiry.reopenedByName}</strong> on {formatDate(inquiry.reopenedAt)}
                </span>
              </div>
            )}
          </div>
        )}

        {inquiry.status === 'spam' && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-5 text-sm text-red-600 flex items-center gap-2">
            <Ban className="h-4 w-4" />
            This inquiry has been marked as spam.
          </div>
        )}

        {/* Notice: sender account no longer active */}
        {inquiry.senderAccountStatus && inquiry.senderAccountStatus !== 'active' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-5 text-sm text-amber-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              The person who sent this inquiry is no longer reachable via the portal. Their account is currently <strong>{inquiry.senderAccountStatus}</strong>. Any replies you send here will not be delivered to them through the platform.
            </span>
          </div>
        )}

        {isActive && expiry && (
          <div className={`rounded-lg border px-4 py-3 mb-5 text-sm flex items-center gap-2 ${
            isExpired
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}>
            <Clock className="h-4 w-4" />
            {isExpired ? 'This inquiry has expired.' : expiry}
          </div>
        )}

        {/* Sender info strip */}
        <div className="bg-white border border-surface-200 rounded-xl shadow-card mb-5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3">
            Sender
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-surface-700">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-surface-400" />
              {inquiry.senderName}
            </span>
            <a
              href={`mailto:${inquiry.senderEmail}`}
              className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              {inquiry.senderEmail}
            </a>
            {inquiry.senderPhone && (
              <a
                href={`tel:${inquiry.senderPhone}`}
                className="inline-flex items-center gap-1.5 text-primary-600 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {inquiry.senderPhone}
              </a>
            )}
            <span className="inline-flex items-center gap-1.5 text-surface-400">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(inquiry.createdAt)}
            </span>
          </div>
        </div>

        {/* Unified conversation thread */}
        <div className="bg-white border border-surface-200 rounded-xl shadow-card mb-5">
          <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-surface-100">
            <MessageSquare className="h-4 w-4 text-surface-400" />
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">
              Conversation ({allMessages.length})
            </p>
          </div>
          <div className="px-5 pt-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-1 text-sm text-amber-700 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Be cautious of suspicious links in conversations. Never share personal or financial information.</span>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto">
            {allMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwner={msg.senderRole === 'business_owner' || msg.senderRole === 'contractor' || msg.senderId === user?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply form (only when active and not expired) */}
        {canSendMessage && !isExpired && (
          <div className="bg-white border border-surface-200 rounded-xl shadow-card">
            <div className="px-5 py-4 space-y-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                rows={4}
                placeholder="Write a message..."
                className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => sendMutation.mutate()}
                  disabled={!messageText.trim() || sendMutation.isPending}
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />}
                  {sendMutation.isPending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
              {sendMutation.isError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Something went wrong. Please try again.
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <ConfirmModal
        open={showReopenConfirm}
        onClose={() => setShowReopenConfirm(false)}
        onConfirm={() => {
          reopenMutation.mutate()
          setShowReopenConfirm(false)
        }}
        title="Reopen Inquiry"
        message="Are you sure you want to reopen this inquiry? The conversation thread will become active again."
        confirmLabel="Yes, reopen it"
        confirmVariant="primary"
        loading={reopenMutation.isPending}
      />
    </>
  )
}
