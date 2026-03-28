import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import NotificationBell from '@/components/NotificationBell'
import { adminApi } from '@/api/admin'
import {
  LayoutDashboard,
  Users,
  ScrollText,
  ShieldCheck,
  Building2,
  FolderTree,
  MessageSquare,
  Star,
  Sparkles,
  Bug,
  Flag,
  Home,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

const systemLinks = [
  { label: 'Dashboard', to: '/system/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/system/users', icon: Users },
  { label: 'Bug Reports', to: '/system/bug-reports', icon: Bug },
  { label: 'Audit Logs', to: '/system/audit-logs', icon: ScrollText },
]

const adminLinks = [
  {
    label: 'Moderation Queue',
    to: '/system/moderation',
    icon: ShieldCheck,
  },
  { label: 'All Businesses', to: '/system/businesses', icon: Building2 },
  { label: 'Categories', to: '/system/categories', icon: FolderTree },
  { label: 'Inquiries', to: '/system/inquiries', icon: MessageSquare },
  { label: 'Reviews', to: '/system/reviews', icon: Star },
  { label: 'Flags', to: '/system/flags', icon: Flag },
  { label: 'Portal Feedback', to: '/system/portal-feedback', icon: Sparkles },
]

export default function SystemAdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    refetchInterval: 60_000,
  })

  const pendingCount = stats?.pendingApprovals ?? 0

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="flex h-screen font-sans">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary-800 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-6">
          <span className="text-lg font-bold text-white">System Admin</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-primary-300 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* System navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-primary-400">
            System
          </div>
          <div className="space-y-1">
            {systemLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
                }`}
              >
                <link.icon className="h-5 w-5" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Admin section */}
          <div className="mb-2 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-primary-400">
            Administration
          </div>
          <div className="space-y-1">
            {adminLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary-700 text-white'
                    : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
                }`}
              >
                <link.icon className="h-5 w-5" />
                <span className="flex-1">{link.label}</span>
                {link.to === '/system/moderation' && pendingCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1.5 text-xs font-bold text-primary-900">
                    {pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom links */}
        <div className="border-t border-primary-700 p-3">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-200 transition-colors hover:bg-primary-700/50 hover:text-white"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-primary-200 transition-colors hover:bg-primary-700/50 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-surface-600 hover:bg-surface-50 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <NotificationBell />
            {user && (
              <>
                <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  System Admin
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <span className="text-sm font-medium text-surface-700">
                  {user.firstName} {user.lastName}
                </span>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-surface-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
