import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
}

const faqs = [
  {
    question: 'What is the Yamacraw Business Portal?',
    answer:
      'The Yamacraw Business Portal is a civic directory that connects residents of Yamacraw, New Providence, The Bahamas with local businesses, contractors, and service providers. It gives local enterprises the visibility they deserve and makes it easier for the community to find trusted services.',
  },
  {
    question: 'How do I register my business?',
    answer:
      'Create an account on the portal by clicking "Register" and selecting "Business Owner" as your account type. Once registered, you can create a business listing from your dashboard by providing your business name, category, description, contact information, and other details.',
  },
  {
    question: 'How do I register as a contractor?',
    answer:
      'The registration process for contractors is the same as for businesses. When creating your listing, select the "Contractor" option to indicate that you hold a government contract. Your listing will be tagged accordingly so residents can identify government contractors in the directory.',
  },
  {
    question: 'Is the portal free to use?',
    answer:
      'Yes, creating an account and listing your business or contractor services on the Yamacraw Business Portal is completely free. The portal is a community initiative designed to support local economic growth.',
  },
  {
    question: 'How do I submit a listing for approval?',
    answer:
      'After creating your listing, review all the details and click "Submit for Review" from your dashboard. Your listing will be reviewed by a moderator to ensure it meets community guidelines before being published.',
  },
  {
    question: 'How long does approval take?',
    answer:
      'Most listings are reviewed within 1-2 business days. You will receive a notification once your listing has been approved or if any changes are needed. During peak times, reviews may take slightly longer.',
  },
  {
    question: 'Can I have multiple listings?',
    answer:
      'Yes, if you operate more than one business or offer distinct services, you can create separate listings for each one from your dashboard. Each listing will go through its own approval process.',
  },
  {
    question: 'How do I contact a business listed on the portal?',
    answer:
      'Each business listing includes a contact section where you can send an inquiry directly to the business owner. Fill out the inquiry form with your name, email, and message, and the business owner will receive a notification.',
  },
  {
    question: 'What happens when I submit an inquiry?',
    answer:
      'When you submit an inquiry through a business listing, the business owner receives a notification and can view your message from their dashboard. They can then reply directly, and you will be notified of their response via email.',
  },
  {
    question: 'Who moderates the listings?',
    answer:
      'Listings are moderated by portal administrators who review submissions for accuracy and compliance with community guidelines. This ensures that all published listings are legitimate and helpful for residents.',
  },
  {
    question: 'How do I update my business information?',
    answer:
      'Log into your account and navigate to your dashboard. Select the listing you want to edit and update any information as needed. Depending on the nature of the changes, your listing may need to go through a brief re-review.',
  },
  {
    question: 'What is the difference between a business and a contractor?',
    answer:
      'A business typically refers to a privately owned enterprise that offers goods or services to the public. A contractor is an individual or company that holds a government contract to carry out specific work or provide services on behalf of the government. Both can be listed on the portal.',
  },
  {
    question: 'How do I report an issue with a listing?',
    answer:
      'If you notice incorrect information, inappropriate content, or any other issue with a listing, please contact us through the Contact page. Provide the listing name and a description of the issue, and our moderation team will investigate promptly.',
  },
]

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="border-b border-surface-200 last:border-b-0"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-base font-semibold text-surface-800">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-surface-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-surface-500">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
              Frequently Asked Questions
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 max-w-xl text-surface-500">
              Find answers to common questions about the Yamacraw Business Portal,
              registration, listings, and more.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {faqs.map((faq, i) => (
            <FaqItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>

        {/* Still have questions */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-12 rounded-xl border border-surface-200 bg-surface-50 p-6 text-center sm:p-8"
        >
          <h3 className="text-lg font-bold text-surface-900">Still have questions?</h3>
          <p className="mt-2 text-sm text-surface-500">
            Can't find what you're looking for? Reach out to our team directly.
          </p>
          <a
            href="/contact"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Contact Us
          </a>
        </motion.div>
      </section>
    </div>
  )
}
