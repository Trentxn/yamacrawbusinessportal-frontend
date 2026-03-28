import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Building2, Database, Clock } from 'lucide-react'
import { systemAdminApi } from '@/api/systemAdmin'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
}

export default function SystemDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['system', 'stats'],
    queryFn: () => systemAdminApi.getStats().then((r) => r.data),
  })

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '--',
      icon: Users,
      color: 'text-primary-600',
      bg: 'bg-primary-50',
    },
    {
      label: 'Total Businesses',
      value: stats?.totalBusinesses ?? '--',
      icon: Building2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Database Size',
      value: stats?.dbSize ?? '--',
      icon: Database,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'System Uptime',
      value: stats?.uptime ?? '--',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
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
        <h1 className="text-3xl font-bold text-surface-900 mb-1">System Dashboard</h1>
        <p className="text-surface-500 mb-8">
          System-level monitoring and platform health overview.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5"
        variants={stagger}
      >
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.div key={card.label} variants={fadeIn}>
              <div className="rounded-xl border border-surface-200 bg-white shadow-card p-5 flex items-start gap-4">
                <div className={`${card.bg} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-surface-500">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color} mt-0.5`}>
                    {isLoading ? (
                      <span className="inline-block w-16 h-7 rounded bg-surface-100 animate-pulse" />
                    ) : (
                      card.value
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
