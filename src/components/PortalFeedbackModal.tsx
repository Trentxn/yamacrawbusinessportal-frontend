import { useState } from 'react'
import { Star, X, Loader2 } from 'lucide-react'
import client from '@/api/client'

const LS_SUBMITTED = 'portal_feedback_submitted'

interface Props {
  onClose: () => void
}

export default function PortalFeedbackModal({ onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const alreadySubmitted = localStorage.getItem(LS_SUBMITTED) === 'true'

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
      setTimeout(onClose, 2000)
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {submitted || alreadySubmitted ? (
          <div className="flex flex-col items-center py-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Star className="h-6 w-6 fill-green-600 text-green-600" />
            </div>
            <p className="text-base font-semibold text-surface-800">
              {alreadySubmitted && !submitted ? 'Already submitted' : 'Thank you!'}
            </p>
            <p className="text-sm text-surface-500 mt-1">
              {alreadySubmitted && !submitted
                ? "You've already shared your feedback."
                : 'Your feedback helps us improve.'}
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg border border-surface-200 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-surface-900">
                  Share Your Feedback
                </h3>
                <p className="text-sm text-surface-500 mt-0.5">
                  Help us make the portal better.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors -mt-1 -mr-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stars */}
            <div className="flex items-center gap-1.5 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  onClick={() => setRating(i)}
                  onMouseEnter={() => setHoveredStar(i)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="rounded p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      i <= (hoveredStar || rating)
                        ? 'fill-accent-500 text-accent-500'
                        : 'text-surface-200'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-surface-500">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Great'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us more about your experience... (optional)"
              rows={3}
              className="mb-4 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-700 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Feedback
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
