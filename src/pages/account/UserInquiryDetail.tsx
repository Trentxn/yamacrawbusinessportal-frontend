import { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  MessageSquare,
  Clock,
  Lock,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  RotateCcw,
  ChevronDown,
  ShieldAlert,
  Flag,
} from 'lucide-react'
import { serviceRequestsApi } from '@/api/serviceRequests'
import client from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import ConfirmModal from '@/components/ConfirmModal'
import type { ServiceRequestStatus, InquiryMessage } from '@/api/types'

// ─── Status badge ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ServiceRequestStatus,
  { label: string; classes: string }
> = {
  open:    { label: 'Sent',    classes: 'bg-blue-100 text-blue-800' },
  read:    { label: 'Read',    classes: 'bg-amber-100 text-amber-800' },
  replied: { label: 'Replied', classes: 'bg-green-100 text-green-800' },
  closed:  { label: 'Closed',  classes: 'bg-surface-100 text-surface-600' },
  spam:    { label: 'Closed',  classes: 'bg-surface-100 text-surface-600' },
}

function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  const { label, classes } = STATUS_CONFIG[status] ?? {
    label: status,
    classes: 'bg-surface-100 text-surface-600',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${classes}`}>
      {label}
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

// ─── Close reasons ───────────────────────────────────────────────────────────

const CLOSE_REASONS = [
  'Resolved - got the info I needed',
  'Resolved - hired this business',
  'No longer needed',
  'Found another provider',
  'Other',
] as const

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

function MessageBubble({ msg, isMine }: { msg: InquiryMessage; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 ${
          isMine
            ? 'bg-primary-600 text-white'
            : 'bg-surface-50 border border-surface-200 text-surface-800'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold ${isMine ? 'text-white/80' : 'text-surface-500'}`}>
            {msg.senderName}
          </span>
          <span className={`text-[11px] ${isMine ? 'text-white/50' : 'text-surface-400'}`}>
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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

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

// ─── Close modal ──────────────────────────────────────────────────────────────

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
  const canConfirm = selectedReason !== '' && (selectedReason !== 'Other' || customReason.trim() !== '')

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
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div>
            <label htmlFor="close-reason" className="block text-sm font-medium text-surface-700 mb-1.5">
              Why are you closing this inquiry?
            </label>
            <div className="relative">
              <select
                id="close-reason"
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full appearance-none rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5 pr-10 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
              >
                <option value="" disabled>Select a reason...</option>
                {CLOSE_REASONS.map((reason) => (
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserInquiryDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [messageText, setMessageText] = useState('')
  const [toast, setToast] = useState<Toast | null>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showReopenConfirm, setShowReopenConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')

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

  const sendMutation = useMutation({
    mutationFn: () => serviceRequestsApi.addMessage(id!, messageText.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiry', id] })
      setMessageText('')
      showToast('success', 'Message sent.')
    },
    onError: () => showToast('error', 'Failed to send message. Please try again.'),
  })

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
      setFlagReason('')
      showToast('success', 'Inquiry flagged for review.')
    },
    onError: () => showToast('error', 'Failed to flag inquiry.'),
  })

  const expiry = inquiry ? timeRemaining(inquiry.expiresAt) : null
  const isExpired = expiry === 'Expired'
  const isActive = inquiry && inquiry.status !== 'closed' && inquiry.status !== 'spam'
  const canSendMessage = isActive && !isExpired

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowFlagModal(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-xl shadow-elevated w-full max-w-md"
            >
              <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
                <h3 className="text-base font-semibold text-surface-900">Flag Inquiry</h3>
                <button onClick={() => setShowFlagModal(false)} className="text-surface-400 hover:text-surface-600"><X className="h-5 w-5" /></button>
              </div>
              <div className="px-5 py-5 space-y-4">
                <p className="text-sm text-surface-500">Describe why you are flagging this inquiry for review.</p>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for flagging..."
                  className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-surface-100 px-5 py-4">
                <button onClick={() => setShowFlagModal(false)} disabled={flagMutation.isPending} className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-50">Cancel</button>
                <button onClick={() => flagMutation.mutate(flagReason)} disabled={!flagReason.trim() || flagMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {flagMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {flagMutation.isPending ? 'Flagging...' : 'Submit Flag'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto py-10 px-6">
        {/* Back link always visible */}
        <Link
          to="/account/inquiries"
          className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          All Inquiries
        </Link>

        {isLoading && <Skeleton />}

        {isError && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-5 py-4 text-sm">
            Failed to load this inquiry. Please try again or go back to your
            inquiries list.
          </div>
        )}

        {!isLoading && !isError && !inquiry && (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 font-medium">Inquiry not found.</p>
            <Link
              to="/account/inquiries"
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
                  <CalendarDays className="w-3.5 h-3.5 text-surface-400" />
                  {formatDate(inquiry.createdAt)}
                </span>

                {/* Close button */}
                {isActive && (
                  <button
                    onClick={() => setShowCloseModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs font-medium text-surface-600 hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors ml-auto"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Close
                  </button>
                )}

                {/* Flag button */}
                {inquiry && (
                  <button
                    onClick={() => setShowFlagModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs font-medium text-surface-600 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Flag
                  </button>
                )}

                {/* Reopen button */}
                {canReopen && (
                  <button
                    onClick={() => setShowReopenConfirm(true)}
                    disabled={reopenMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1 text-xs font-medium text-surface-600 hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50 transition-colors ml-auto disabled:opacity-50"
                  >
                    {reopenMutation.isPending
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <RotateCcw className="h-3.5 w-3.5" />}
                    {reopenMutation.isPending ? 'Reopening...' : 'Reopen'}
                  </button>
                )}
              </div>
            </div>

            {/* Closed / expiry info */}
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

            {isActive && expiry && (
              <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 ${
                isExpired
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}>
                <Clock className="h-4 w-4" />
                {isExpired ? 'This inquiry has expired.' : expiry}
              </div>
            )}

            <hr className="border-surface-200" />

            {/* Unified conversation */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-surface-400" />
                <h2 className="text-sm font-semibold text-surface-600 uppercase tracking-wide">
                  Conversation ({allMessages.length})
                </h2>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 mb-3 text-sm text-amber-700 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Be cautious of suspicious links in conversations. Never share personal or financial information.</span>
              </div>
              <div className="bg-white border border-surface-200 rounded-xl shadow-card px-5 py-4 space-y-3 max-h-[500px] overflow-y-auto">
                {allMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMine={msg.senderId === user?.id}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </section>

            {/* Reply form */}
            {canSendMessage && (
              <section>
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
              </section>
            )}

            {/* Awaiting reply hint */}
            {!canSendMessage && isActive && isExpired && (
              <p className="text-xs text-surface-400 italic text-center">
                This inquiry has expired. No further messages can be sent.
              </p>
            )}

            {inquiry.messages.length === 0 && isActive && !isExpired && (
              <p className="text-xs text-surface-400 italic">
                No reply yet. The business will be notified of your inquiry.
              </p>
            )}
          </motion.div>
        )}
      </div>

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
