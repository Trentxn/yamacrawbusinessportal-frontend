import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2 } from 'lucide-react'
import client from '@/api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'info@yamacrawbusinessportal.com',
    href: 'mailto:info@yamacrawbusinessportal.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '1 (242) 828-1738 / 1 (242) 815-7047',
    href: 'tel:+12428281738',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Yamacraw, New Providence, The Bahamas',
    href: null,
  },
]

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      await client.post('/contact/', form)
      setSubmitted(true)
    } catch {
      setError('Failed to send your message. Please try again or email us directly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="border-b border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.h1
              variants={fadeUp}
              className="text-3xl font-bold tracking-tight text-surface-900 sm:text-4xl"
            >
              Contact Us
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 max-w-xl text-surface-500">
              Have a question about the Yamacraw Business Portal? We're here to help businesses
              and residents connect with the resources they need.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Contact info cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-4 lg:col-span-2"
          >
            {contactInfo.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  className="rounded-xl border border-surface-200 bg-white p-5 shadow-card"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-surface-800">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="mt-0.5 text-sm text-primary-600 transition-colors hover:text-primary-700"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="mt-0.5 text-sm text-surface-500">{item.value}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}

            <motion.div
              variants={fadeUp}
              className="rounded-xl border border-accent-200 bg-accent-50 p-5"
            >
              <p className="text-sm font-semibold text-accent-800">Office Hours</p>
              <p className="mt-1 text-sm text-accent-700">
                Monday - Friday: 9:00 AM - 5:00 PM
              </p>
              <p className="text-sm text-accent-700">Saturday - Sunday: Closed</p>
            </motion.div>
          </motion.div>

          {/* Contact form */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="lg:col-span-3"
          >
            <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-card sm:p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col items-center py-12 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-7 w-7 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-surface-900">Message Sent</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-surface-500">
                    Thank you for your message. We'll get back to you soon.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setForm({ name: '', email: '', subject: '', message: '' })
                    }}
                    className="mt-6 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-surface-900">Send us a message</h2>
                  <p className="mt-1 text-sm text-surface-500">
                    Fill out the form below and we'll respond as soon as possible.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-1.5 block text-sm font-medium text-surface-700"
                        >
                          Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="mb-1.5 block text-sm font-medium text-surface-700"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="mb-1.5 block text-sm font-medium text-surface-700"
                      >
                        Subject
                      </label>
                      <input
                        id="subject"
                        name="subject"
                        type="text"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-surface-300 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="mb-1.5 block text-sm font-medium text-surface-700"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        className="w-full resize-none rounded-lg border border-surface-300 px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="Tell us more..."
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
