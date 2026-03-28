import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAdminBasePath } from '@/hooks/useAdminBasePath'
import { motion } from 'framer-motion'
import {
  Building2,
  ClipboardCheck,
  Users,
  MessageSquare,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'
import { adminApi } from '@/api/admin'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
}

export default function AdminDashboard() {
  const basePath = useAdminBasePath()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  })

  const statCards = [
    {
      label: 'Total Businesses',
      value: stats?.totalBusinesses ?? '--',
      icon: Building2,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Pending Approvals',
      value: stats?.pendingApprovals ?? '--',
      icon: ClipboardCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      link: `${basePath}/moderation`,
    },
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '--',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Total Inquiries',
      value: stats?.totalInquiries ?? '--',
      icon: MessageSquare,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Inquiries This Month',
      value: stats?.inquiriesThisMonth ?? '--',
      icon: CalendarDays,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ]

  return (
    <motion.div
      className="max-w-6xl mx-auto py-10 px-6"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      <motion.div variants={fadeIn}>
        <h1 className="text-3xl font-bold text-surface-900 mb-1">Admin Dashboard</h1>
        <p className="text-surface-500 mb-8">
          Platform overview and administrative controls.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
        variants={stagger}
      >
        {statCards.map((card) => {
          const Icon = card.icon
          const inner = (
            <div className="rounded-xl border border-surface-200 bg-white shadow-card p-5 flex items-start gap-4">
              <div className={`${card.bg} rounded-lg p-3`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-surface-500">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color} mt-0.5`}>
                  {isLoading ? (
                    <span className="inline-block w-10 h-7 rounded bg-surface-100 animate-pulse" />
                  ) : (
                    card.value
                  )}
                </p>
              </div>
            </div>
          )

          return (
            <motion.div key={card.label} variants={fadeIn}>
              {card.link ? (
                <Link to={card.link} className="block hover:ring-2 hover:ring-primary-200 rounded-xl transition-shadow">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </motion.div>
          )
        })}

        {/* Top Categories card */}
        <motion.div variants={fadeIn}>
          <div className="rounded-xl border border-surface-200 bg-white shadow-card p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-accent-50 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-accent-500" />
              </div>
              <p className="text-sm font-medium text-surface-500">Top Categories</p>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 rounded bg-surface-100 animate-pulse" />
                ))}
              </div>
            ) : stats?.topCategories && stats.topCategories.length > 0 ? (
              <ul className="space-y-2">
                {stats.topCategories.slice(0, 5).map((cat) => (
                  <li key={cat.name} className="flex items-center justify-between text-sm">
                    <span className="text-surface-700 font-medium">{cat.name}</span>
                    <span className="text-surface-400 tabular-nums">{cat.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-surface-400">No category data yet.</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
