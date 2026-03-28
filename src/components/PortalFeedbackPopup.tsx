import { useState, useEffect } from 'react'
import { Star, X, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import client from '@/api/client'

const LS_SUBMITTED = 'portal_feedback_submitted'
const LS_DISMISSED = 'portal_feedback_dismissed'
const SHOW_DELAY = 120_000

export default function PortalFeedbackPopup() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [show, setShow] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Don't render for admins
  const isAdmin = user?.role === 'admin' || user?.role === 'system_admin'

  useEffect(() => {
    if (isAdmin) return
    if (localStorage.getItem(LS_SUBMITTED) || localStorage.getItem(LS_DISMISSED)) return

    const timer = setTimeout(() => {
      setVisible(true)
      // Trigger slide-in on next frame
      requestAnimationFrame(() => setShow(true))
    }, SHOW_DELAY)

    return () => clearTimeout(timer)
  }, [isAdmin])

  if (!visible || isAdmin) return null

  const handleDismiss = () => {
    localStorage.setItem(LS_DISMISSED, 'true')
    setShow(false)
    setTimeout(() => setVisible(false), 300)
  }

  const handleSubmit = async () => {
    if (rating === 0 || submitting) return
    setSubmitting(true)
    try {
      await client.post('/portal-feedback/', {
        rating,
        comment: comment.trim() || undefined,
      })
      localStorage.setItem(LS_SUBMITTED, 'true')
      setSubmitted(true)
      setTimeout(() => {
        setShow(false)
        setTimeout(() => setVisible(false), 300)
      }, 2000)
    } catch {
      // Silently fail — feedback is non-critical
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-full max-w-sm transition-all duration-300 ease-out ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div className="rounded-xl border border-surface-200 bg-white shadow-elevated p-5">
        {submitted ? (
          <div className="flex flex-col items-center py-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Star className="h-5 w-5 fill-green-600 text-green-600" />
            </div>
            <p className="text-sm font-medium text-surface-800">Thank you!</p>
            <p className="text-xs text-surface-500 mt-1">Your feedback helps us improve.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-surface-900">
                How's your experience?
              </h3>
              <button
                onClick={handleDismiss}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors -mt-1 -mr-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoveredStar(i)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="rounded p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      i <= (hoveredStar || rating)
                        ? 'fill-accent-500 text-accent-500'
                        : 'text-surface-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any additional thoughts? (optional)"
              rows={2}
              className="mb-3 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit Feedback
            </button>
          </>
        )}
      </div>
    </div>
  )
}
