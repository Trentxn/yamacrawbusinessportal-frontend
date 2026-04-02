import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import PortalFeedbackPopup from '@/components/PortalFeedbackPopup'
import PortalFeedbackModal from '@/components/PortalFeedbackModal'
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
} from 'lucide-react'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Directory', to: '/directory' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const footerLinks = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
]

export default function PublicLayout() {
  const { user, isAuthenticated, logout } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    setUserDropdownOpen(false)
    await logout()
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-surface-200 bg-white shadow-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary-600">
              Yamacraw Business Portal
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-surface-200 bg-white py-1 shadow-elevated">
                      {(user.role === 'business_owner' || user.role === 'contractor') && (
                        <Link
                          to="/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      {user.role === 'system_admin' && (
                        <Link
                          to="/system"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          System Panel
                        </Link>
                      )}
                      <Link
                        to="/account/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-surface-700 hover:bg-surface-50"
                      >
                        <User className="h-4 w-4" />
                        My Account
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-surface-600 hover:bg-surface-50 md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-surface-200 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-surface-200 pt-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <span className="text-sm font-medium text-surface-900">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  {(user.role === 'business_owner' || user.role === 'contractor') && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm text-surface-600 hover:bg-surface-50"
                    >
                      Dashboard
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm text-surface-600 hover:bg-surface-50"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {user.role === 'system_admin' && (
                    <Link
                      to="/system"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-lg px-4 py-2 text-sm text-surface-600 hover:bg-surface-50"
                    >
                      System Panel
                    </Link>
                  )}
                  <Link
                    to="/account/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-2 text-sm text-surface-600 hover:bg-surface-50"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="rounded-lg px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-4 py-2 text-center text-sm font-medium text-surface-700 hover:bg-surface-50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div>
              <Link to="/" className="text-lg font-bold text-primary-600">
                Yamacraw Business Portal
              </Link>
              <p className="mt-1 text-sm text-surface-500">
                Connecting the community with local businesses.
              </p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-surface-500 transition-colors hover:text-primary-600"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => setFeedbackModalOpen(true)}
                className="text-sm text-surface-500 transition-colors hover:text-primary-600"
              >
                Feedback
              </button>
            </nav>
          </div>
          <div className="mt-8 border-t border-surface-200 pt-6 text-center text-sm text-surface-400">
            &copy; {new Date().getFullYear()} Yamacraw Business Portal. All
            rights reserved.
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-xs text-surface-400">Compatible with</span>
              <img src="/browsers/chrome.svg" alt="Chrome" className="h-5 w-5" />
              <img src="/browsers/firefox.jpg" alt="Firefox" className="h-5 w-5 rounded-full object-cover" />
              <img src="/browsers/safari.svg" alt="Safari" className="h-5 w-5" />
              <img src="/browsers/edge.svg" alt="Edge" className="h-5 w-5" />
              <img src="/browsers/opera.svg" alt="Opera" className="h-5 w-5" />
            </div>
          </div>
        </div>
      </footer>

      <PortalFeedbackPopup />
      {feedbackModalOpen && (
        <PortalFeedbackModal onClose={() => setFeedbackModalOpen(false)} />
      )}
    </div>
  )
}
