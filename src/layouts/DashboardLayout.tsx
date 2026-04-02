import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Joyride } from 'react-joyride'
import { useAuth } from '@/contexts/AuthContext'
import { serviceRequestsApi } from '@/api/serviceRequests'
import { useDashboardTour } from '@/hooks/useDashboardTour'
import {
  LayoutDashboard,
  Store,
  MessageSquare,
  Send,
  Star,
  Home,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

const TOUR_KEYS: Record<string, string> = {
  '/dashboard/overview': 'overview',
  '/dashboard/listings': 'listings',
  '/dashboard/inquiries': 'inquiries',
  '/account/inquiries': 'sent-inquiries',
  '/dashboard/reviews': 'reviews',
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isContractor = user?.role === 'contractor'
  const { run: tourRun, steps: tourSteps, handleEvent: tourHandler } = useDashboardTour()

  // Fetch count of open (unread) inquiries for the badge
  const { data: openInquiries } = useQuery({
    queryKey: ['dashboard', 'inquiries', 'open-count'],
    queryFn: () =>
      serviceRequestsApi
        .listReceived({ status: 'open', page: 1, pageSize: 1 })
        .then((r) => r.data.total),
    refetchInterval: 60_000,
  })

  const sidebarLinks = [
    { label: 'Overview', to: '/dashboard/overview', icon: LayoutDashboard },
    { label: isContractor ? 'My Services' : 'My Listings', to: '/dashboard/listings', icon: Store },
    {
      label: isContractor ? 'Client Inquiries' : 'Received Inquiries',
      to: '/dashboard/inquiries',
      icon: MessageSquare,
      badge: openInquiries ?? 0,
    },
    { label: 'Sent Inquiries', to: '/account/inquiries', icon: Send },
    { label: 'Reviews', to: '/dashboard/reviews', icon: Star },
  ]

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="flex h-screen font-sans">
      <Joyride
        steps={tourSteps}
        run={tourRun}
        onEvent={tourHandler}
        continuous
        options={{
          buttons: ['back', 'close', 'primary', 'skip'],
          showProgress: true,
          overlayClickAction: 'next',
          primaryColor: '#1B3A5C',
          zIndex: 10000,
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Got it!',
          next: 'Next',
          skip: 'Skip tour',
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        data-tour="sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-primary-800 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-6">
          <span className="text-lg font-bold text-white">{isContractor ? 'Contractor Portal' : 'Dashboard'}</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-primary-300 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              data-tour={TOUR_KEYS[link.to]}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-200 hover:bg-primary-700/50 hover:text-white'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="flex-1">{link.label}</span>
              {link.badge !== undefined && link.badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1.5 text-xs font-bold text-primary-900">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="border-t border-primary-700 p-3">
          <Link
            to="/"
            data-tour="back-home"
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
            <span data-tour="notifications">
              <NotificationBell />
            </span>
            {user && (
              <>
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
