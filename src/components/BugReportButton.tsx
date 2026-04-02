import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, X, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { bugReportsApi } from '@/api/bugReports'
import { useAuth } from '@/contexts/AuthContext'

export default function BugReportButton() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      bugReportsApi.create({
        subject: subject.trim(),
        description: description.trim(),
        pageUrl: window.location.href,
      }),
    onSuccess: () => {
      setSuccess(true)
      setSubject('')
      setDescription('')
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 2000)
    },
  })

  if (!isAuthenticated) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setSuccess(false); mutation.reset() }}
        title="Report a bug"
        className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-surface-700 text-white shadow-elevated transition-colors hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2"
      >
        <Bug className="h-5 w-5" />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-white rounded-xl shadow-elevated"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Bug className="h-5 w-5 text-surface-500" />
                  <h3 className="text-base font-semibold text-surface-900">Report a Bug</h3>
                </div>
                <button
                  onClick={() => { setOpen(false); setSuccess(false); mutation.reset() }}
                  className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4">
                {success ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                    <p className="text-sm font-medium text-surface-800">Bug report submitted!</p>
                    <p className="text-xs text-surface-500 mt-1">Thank you for helping us improve.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-surface-500">
                      Found something that doesn't work right? Let us know and we'll fix it.
                    </p>

                    <div>
                      <label htmlFor="bug-subject" className="block text-sm font-medium text-surface-700 mb-1">
                        Subject
                      </label>
                      <input
                        id="bug-subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of the issue"
                        maxLength={255}
                        className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="bug-desc" className="block text-sm font-medium text-surface-700 mb-1">
                        Description
                      </label>
                      <textarea
                        id="bug-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="What happened? What did you expect to happen?"
                        maxLength={5000}
                        className="w-full resize-none rounded-lg border border-surface-200 bg-surface-50 px-3 py-2.5 text-sm text-surface-800 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 transition-colors"
                      />
                    </div>

                    <p className="text-xs text-surface-400">
                      Your current page URL will be included automatically.
                    </p>

                    {mutation.isError && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Failed to submit. Please try again.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!success && (
                <div className="flex justify-end gap-3 border-t border-surface-100 px-5 py-3">
                  <button
                    onClick={() => { setOpen(false); mutation.reset() }}
                    className="inline-flex items-center border border-surface-200 text-surface-700 hover:bg-surface-50 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => mutation.mutate()}
                    disabled={!subject.trim() || !description.trim() || subject.trim().length < 5 || description.trim().length < 10 || mutation.isPending}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {mutation.isPending ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
