import { motion } from 'framer-motion';

const sections = [
  {
    number: 1,
    title: 'Acceptance of Terms',
    content: [
      'By registering for an account or using the Yamacraw Business Portal in any manner, you agree to be bound by these Terms and Conditions. These terms constitute a legally binding agreement between you and the Yamacraw Business Portal.',
      'If you do not agree to these terms in their entirety, you must not register for an account or use the portal.',
    ],
  },
  {
    number: 2,
    title: 'About the Portal',
    content: [
      'The Yamacraw Business Portal is a free civic business directory sponsored by the Office of Minister Zane Enrico Lightbourne. Its purpose is to connect residents of the Yamacraw constituency in The Bahamas with local businesses and services operating in their community.',
      'The portal is provided as a public service to support economic visibility and community connection within the Yamacraw area.',
    ],
  },
  {
    number: 3,
    title: 'User Accounts',
    content: [
      'When creating an account, you must provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.',
      'You must be at least 18 years of age to register for an account or submit a business listing.',
      'You agree to notify us immediately of any unauthorised use of your account. The portal reserves the right to suspend or terminate accounts that violate these terms.',
    ],
  },
  {
    number: 4,
    title: 'User Obligations',
    items: [
      'Provide truthful and accurate information in all submissions and communications through the portal.',
      'Not submit false, misleading, or fraudulent business listings or any other content.',
      'Not use the portal for spam, unsolicited communications, harassment, or any illegal activity.',
      'Not attempt to access, interfere with, or use another user\'s account without authorisation.',
      'Not scrape, harvest, or systematically collect data from the portal by automated or manual means.',
      'Comply with all applicable laws of the Commonwealth of The Bahamas and any other jurisdiction from which you access the portal.',
    ],
  },
  {
    number: 5,
    title: 'Business Listings',
    content: [
      'Business owners and their authorised representatives are solely responsible for ensuring that their listings are accurate, up to date, and not misleading.',
      'All listings are subject to review and approval by portal administrators before publication. Submission of a listing does not guarantee its publication.',
      'Listings must represent legitimate businesses that operate in or actively serve the Yamacraw constituency area.',
      'The portal reserves the right to edit, decline, or remove any listing at any time, without prior notice, if it is found to violate these terms or is otherwise deemed inappropriate.',
    ],
  },
  {
    number: 6,
    title: 'Intellectual Property',
    content: [
      'The portal\'s design, code, branding, and all original content created by the portal team are the intellectual property of the Yamacraw Business Portal and may not be reproduced or used without express written permission.',
      'Users retain ownership of the content they submit, including business descriptions and photographs.',
      'By submitting content to the portal, you grant the Yamacraw Business Portal a non-exclusive, royalty-free, worldwide licence to display, reproduce, and distribute that content solely for the purpose of operating and promoting the portal.',
      'You must not submit content that infringes the intellectual property rights of any third party.',
    ],
  },
  {
    number: 7,
    title: 'Limitation of Liability',
    content: [
      'The portal is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      'The portal does not guarantee the accuracy, completeness, or reliability of any business listing or other content submitted by users.',
      'The portal is not a party to any transaction between users and businesses found through the directory, and accepts no responsibility for the outcome of such interactions.',
      'To the fullest extent permitted by the laws of the Commonwealth of The Bahamas, the portal shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the portal.',
    ],
  },
  {
    number: 8,
    title: 'Content Moderation',
    content: [
      'The portal actively moderates submitted content to maintain the quality and integrity of the directory. Administrators may review, edit, or remove any content, and may suspend or terminate any account, at their sole discretion, without prior notice, where these terms are found to have been violated.',
    ],
  },
  {
    number: 9,
    title: 'Service Availability',
    content: [
      'The portal is provided on a best-efforts basis. The portal may experience periods of downtime for scheduled maintenance, updates, or for reasons outside our control. No guaranteed level of uptime or service availability is offered.',
      'The portal shall not be liable for any loss or inconvenience resulting from service interruptions.',
    ],
  },
  {
    number: 10,
    title: 'Termination',
    content: [
      'The portal may suspend or permanently terminate your account and access to the service at any time, with or without notice, for conduct that is found to violate these terms or is otherwise harmful to other users, the portal, or third parties.',
      'You may delete your account at any time through your account settings. Upon deletion, your account information will be handled in accordance with our Privacy Policy.',
    ],
  },
  {
    number: 11,
    title: 'Indemnification',
    content: [
      'You agree to indemnify, defend, and hold harmless the Yamacraw Business Portal, its sponsors, administrators, and representatives from and against any claims, liabilities, damages, losses, and expenses — including reasonable legal fees — arising out of or in any way connected with your use of the portal, your submitted content, or your violation of these Terms and Conditions.',
    ],
  },
  {
    number: 12,
    title: 'Amendments',
    content: [
      'The portal reserves the right to update or amend these Terms and Conditions at any time. The revised terms will be posted on this page with an updated effective date.',
      'Your continued use of the portal following the posting of any changes constitutes your acceptance of those changes. Where changes are material, we will endeavour to notify registered users via email or a prominent notice on the portal.',
    ],
  },
  {
    number: 13,
    title: 'Governing Law',
    content: [
      'These Terms and Conditions are governed by and construed in accordance with the laws of the Commonwealth of The Bahamas. Any dispute arising out of or relating to these terms or your use of the portal shall be subject to the exclusive jurisdiction of the courts of The Bahamas.',
    ],
  },
  {
    number: 14,
    title: 'Contact',
    content: [
      'If you have any questions, concerns, or requests regarding these Terms and Conditions, please contact us at:',
    ],
    contact: 'info@yamacrawbusinessportal.com',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-14">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' as const }}
          className="mb-10"
        >
          <p className="text-sm font-medium text-accent-500 uppercase tracking-widest mb-3">
            Yamacraw Business Portal
          </p>
          <h1 className="text-4xl font-bold text-primary-700 mb-4 leading-tight">
            Terms and Conditions
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-surface-500 mb-6">
            <span>Last updated: March 2026</span>
            <span className="hidden sm:inline text-surface-300">|</span>
            <span>Effective date: March 2026</span>
          </div>
          <div className="h-px bg-surface-200" />
        </motion.div>

        {/* Intro statement */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' as const, delay: 0.1 }}
          className="text-surface-600 leading-relaxed mb-12"
        >
          Please read these Terms and Conditions carefully before using the Yamacraw Business Portal.
          They set out the rules governing your use of the portal and form a binding agreement between
          you and the Yamacraw Business Portal, sponsored by the Office of Minister Zane Enrico
          Lightbourne.
        </motion.p>

        {/* Sections */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          {sections.map((section) => (
            <motion.section
              key={section.number}
              variants={itemVariants}
              className="scroll-mt-6"
            >
              {/* Section heading */}
              <div className="flex items-start gap-4 mb-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-semibold flex items-center justify-center mt-0.5">
                  {section.number}
                </span>
                <h2 className="text-lg font-semibold text-primary-800 leading-snug pt-1">
                  {section.title}
                </h2>
              </div>

              {/* Section body */}
              <div className="pl-12 space-y-3">
                {section.content?.map((para, i) => (
                  <p key={i} className="text-surface-600 leading-relaxed text-[0.9375rem]">
                    {para}
                  </p>
                ))}

                {section.items && (
                  <ul className="space-y-2 mt-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-surface-600 text-[0.9375rem] leading-relaxed">
                        <span className="flex-shrink-0 mt-2 w-1.5 h-1.5 rounded-full bg-accent-400" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {section.contact && (
                  <a
                    href={`mailto:${section.contact}`}
                    className="inline-block mt-1 text-primary-600 font-medium hover:text-primary-700 hover:underline transition-colors"
                  >
                    {section.contact}
                  </a>
                )}
              </div>
            </motion.section>
          ))}
        </motion.div>

        {/* Footer rule */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-16 pt-8 border-t border-surface-200"
        >
          <p className="text-sm text-surface-400">
            Yamacraw Business Portal — sponsored by the Office of Minister Zane Enrico Lightbourne.
            These terms are effective as of March 2026.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
