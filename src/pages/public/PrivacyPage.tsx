import { motion } from 'framer-motion'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  return (
    <motion.section variants={fadeIn} className="border-t border-surface-200 pt-8 mt-8 first:border-t-0 first:pt-0 first:mt-0">
      <h2 className="text-lg font-semibold text-primary-700 mb-4 tracking-tight">{title}</h2>
      <div className="space-y-3 text-surface-700 leading-relaxed text-[0.9375rem]">
        {children}
      </div>
    </motion.section>
  )
}

function Dl({ items }: { items: { term: string; detail: string }[] }) {
  return (
    <dl className="space-y-2.5">
      {items.map(({ term, detail }) => (
        <div key={term} className="grid grid-cols-[minmax(11rem,auto)_1fr] gap-x-4">
          <dt className="font-medium text-surface-800">{term}</dt>
          <dd className="text-surface-600">{detail}</dd>
        </div>
      ))}
    </dl>
  )
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-none space-y-1.5 pl-0">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 items-start">
          <span className="mt-[0.35rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      {/* Page header */}
      <div className="bg-primary-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p
              variants={fadeIn}
              className="text-accent-300 text-sm font-medium uppercase tracking-widest mb-3"
            >
              Yamacraw Business Portal
            </motion.p>
            <motion.h1
              variants={fadeIn}
              className="text-3xl font-bold tracking-tight mb-3"
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className="text-primary-300 text-sm"
            >
              Last updated: March 2026
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="bg-white rounded-xl border border-surface-200 shadow-card px-8 py-10 space-y-0"
        >
          {/* Intro */}
          <motion.p variants={fadeIn} className="text-surface-600 leading-relaxed text-[0.9375rem] border-b border-surface-200 pb-8 mb-8">
            This Privacy Policy explains how the Yamacraw Business Portal collects, uses, stores, and
            protects your personal information. By using this portal you agree to the practices described
            below. If you do not agree, please discontinue use of the service.
          </motion.p>

          {/* 1. Data Controller */}
          <Section title="1. Data Controller">
            <p>
              The Yamacraw Business Portal is operated under the{' '}
              <span className="font-medium text-surface-800">
                Office of the Member of Parliament for the Yamacraw Constituency
              </span>
              , Nassau, The Bahamas.
            </p>
            <Dl
              items={[
                { term: 'Operated by', detail: 'Office of Minister Zane Enrico Lightbourne, MP for Yamacraw' },
                { term: 'Address', detail: 'Nassau, The Bahamas' },
                { term: 'Privacy enquiries', detail: 'info@yamacrawbusinessportal.com' },
              ]}
            />
            <p>
              For any questions or concerns about how your data is handled, contact us at{' '}
              <a
                href="mailto:info@yamacrawbusinessportal.com"
                className="text-primary-600 underline underline-offset-2 hover:text-primary-800 transition-colors"
              >
                info@yamacrawbusinessportal.com
              </a>
              .
            </p>
          </Section>

          {/* 2. Data We Collect */}
          <Section title="2. Data We Collect">
            <p>We collect the following categories of information:</p>

            <div className="space-y-4">
              <div>
                <p className="font-medium text-surface-800 mb-1.5">Personal information</p>
                <Ul items={[
                  'Full name',
                  'Email address',
                  'Phone number',
                  'Password (stored as a bcrypt hash — never in plain text)',
                ]} />
              </div>

              <div>
                <p className="font-medium text-surface-800 mb-1.5">Business information</p>
                <Ul items={[
                  'Business name, category, and description',
                  'Physical address and operating hours',
                  'Contact details associated with the listing',
                  'Photos uploaded to the listing',
                ]} />
              </div>

              <div>
                <p className="font-medium text-surface-800 mb-1.5">Usage and technical data</p>
                <Ul items={[
                  'IP address and approximate location',
                  'Browser type and version',
                  'Pages visited and time spent on the portal',
                  'Referring URL',
                ]} />
              </div>

              <div>
                <p className="font-medium text-surface-800 mb-1.5">Authentication data</p>
                <Ul items={[
                  'Hashed passwords (bcrypt)',
                  'Short-lived JSON Web Tokens (JWTs) stored in localStorage',
                  'Session and audit log records',
                ]} />
              </div>
            </div>
          </Section>

          {/* 3. How We Collect Data */}
          <Section title="3. How We Collect Your Data">
            <p>Information is collected through the following means:</p>
            <Ul items={[
              'Registration and account creation forms',
              'Business listing submission and editing forms',
              'Inquiry and contact forms submitted through the portal',
              'Cookies and localStorage (used exclusively for authentication tokens)',
              'Server access logs generated automatically when you use the portal',
            ]} />
          </Section>

          {/* 4. Purpose of Collection */}
          <Section title="4. Why We Collect Your Data">
            <p>We collect and process your data solely for the following purposes:</p>
            <Ul items={[
              'To provide and maintain the Yamacraw Business Directory service',
              'To create and manage user accounts and business listings',
              'To authenticate users and secure access to the portal',
              'To facilitate communication between residents and local businesses',
              'To moderate listings and maintain the quality of the directory',
              'To improve the portal based on usage patterns',
              'To comply with legal obligations under Bahamian law',
            ]} />
            <p>
              We do not use your data for any purpose beyond those listed above without your explicit consent.
            </p>
          </Section>

          {/* 5. Security */}
          <Section title="5. How We Protect Your Data">
            <p>We apply the following technical and organisational security measures:</p>
            <Ul items={[
              'Passwords are hashed with bcrypt before storage and are never stored in plain text',
              'Authentication is managed via short-lived JSON Web Tokens (JWTs)',
              'All data is transmitted over HTTPS (TLS encryption in transit)',
              'Role-based access control restricts data access to authorised personnel only',
              'Portal infrastructure is hosted on a secure cloud platform with access controls',
              'Regular security reviews and audits are conducted',
            ]} />
            <p>
              While we take reasonable precautions, no method of transmission over the internet is
              completely secure. We encourage you to use a strong, unique password for your account.
            </p>
          </Section>

          {/* 6. Data Sharing */}
          <Section title="6. Data Sharing and Disclosure">
            <p className="font-medium text-surface-800">
              We do not sell your personal information to any third party.
            </p>
            <p>Your data may be shared in the following limited circumstances:</p>
            <Ul items={[
              'With portal administrators, solely for the purpose of content moderation and support',
              'With the business owner who receives an inquiry — the sender\'s name and contact details are shared so the business can respond',
              'With Resend (our transactional email provider), to deliver account verification and notification emails',
              'With our hosting infrastructure provider, as required to operate the service',
              'With law enforcement or regulatory bodies, if required to do so under the laws of the Commonwealth of The Bahamas',
            ]} />
            <p>
              All third-party service providers are contractually required to handle your data
              confidentially and only for the purposes for which it was shared.
            </p>
          </Section>

          {/* 7. Data Retention */}
          <Section title="7. Data Retention">
            <p>We retain your data for the following periods:</p>
            <Dl items={[
              { term: 'Account data', detail: 'Retained for as long as your account is active. Deleted upon a verified deletion request.' },
              { term: 'Business listings', detail: 'Retained for as long as the listing is active on the portal.' },
              { term: 'Inquiry messages', detail: 'Retained for as long as the associated accounts are active.' },
              { term: 'Server access logs', detail: 'Retained for 90 days, then automatically purged.' },
              { term: 'Audit logs', detail: 'Retained for 1 year for security and compliance purposes.' },
            ]} />
            <p>
              When data is deleted, it is removed from active systems. Residual copies in automated
              backups are overwritten in accordance with our standard backup rotation schedule.
            </p>
          </Section>

          {/* 8. Your Rights */}
          <Section title="8. Your Rights">
            <p>You have the following rights in relation to your personal data:</p>
            <Ul items={[
              'Right of access — you may request a copy of the personal data we hold about you',
              'Right to rectification — you may request correction of inaccurate or incomplete data',
              'Right to erasure — you may request deletion of your account and associated personal data',
              'Right to withdraw consent — where processing is based on consent, you may withdraw it at any time',
            ]} />
            <p>
              To exercise any of these rights, send a written request to{' '}
              <a
                href="mailto:info@yamacrawbusinessportal.com"
                className="text-primary-600 underline underline-offset-2 hover:text-primary-800 transition-colors"
              >
                info@yamacrawbusinessportal.com
              </a>
              . We will respond within a reasonable timeframe and in accordance with applicable law.
            </p>
          </Section>

          {/* 9. Cookies */}
          <Section title="9. Cookies and Local Storage">
            <p>
              The Yamacraw Business Portal uses a minimal approach to browser storage:
            </p>
            <Ul items={[
              'Authentication tokens (JWTs) are stored in localStorage to maintain your login session',
              'No third-party tracking or analytics cookies are used',
              'No advertising or retargeting cookies are placed on your device',
              'No cross-site tracking technologies are employed',
            ]} />
            <p>
              You may clear localStorage at any time through your browser settings, which will log you
              out of the portal.
            </p>
          </Section>

          {/* 10. Children */}
          <Section title="10. Children's Privacy">
            <p>
              The Yamacraw Business Portal is intended for use by persons aged 18 and over. We do not
              knowingly collect personal information from individuals under the age of 18. If we become
              aware that a minor has provided personal data, we will take steps to delete that information
              promptly. If you believe a minor has submitted data to the portal, please contact us at{' '}
              <a
                href="mailto:info@yamacrawbusinessportal.com"
                className="text-primary-600 underline underline-offset-2 hover:text-primary-800 transition-colors"
              >
                info@yamacrawbusinessportal.com
              </a>
              .
            </p>
          </Section>

          {/* 11. Changes */}
          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices or
              legal requirements. When we make material changes, we will notify registered users by:
            </p>
            <Ul items={[
              'Sending a notification to the email address associated with your account, and/or',
              'Displaying a prominent notice within the portal',
            ]} />
            <p>
              The "Last updated" date at the top of this page will always reflect when the policy was
              most recently revised. We encourage you to review this page periodically.
            </p>
          </Section>

          {/* 12. Governing Law */}
          <Section title="12. Governing Law">
            <p>
              This Privacy Policy is governed by and construed in accordance with the laws of the
              Commonwealth of The Bahamas, including the{' '}
              <span className="font-medium text-surface-800">Data Protection (Privacy of Personal Information) Act</span>
              . Any disputes arising in connection with this policy shall be subject to the jurisdiction
              of the courts of The Bahamas.
            </p>
          </Section>

          {/* Contact footer */}
          <motion.div
            variants={fadeIn}
            className="mt-10 pt-8 border-t border-surface-200"
          >
            <div className="bg-surface-50 rounded-lg border border-surface-200 px-6 py-5">
              <p className="text-sm font-medium text-surface-800 mb-1">Questions about this policy?</p>
              <p className="text-sm text-surface-600">
                Contact the Yamacraw Business Portal privacy team at{' '}
                <a
                  href="mailto:info@yamacrawbusinessportal.com"
                  className="text-primary-600 underline underline-offset-2 hover:text-primary-800 transition-colors"
                >
                  info@yamacrawbusinessportal.com
                </a>
                .
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
