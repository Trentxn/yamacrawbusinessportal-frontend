import { Link } from 'react-router-dom'
import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-12 font-sans">
      {/* Logo */}
      <Link to="/" className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">
          Yamacraw Business Portal
        </h1>
        <p className="mt-1 text-sm text-primary-200">
          Connecting the community with local businesses
        </p>
      </Link>

      {/* Card container */}
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-elevated">
        <Outlet />
      </div>

      {/* Footer links */}
      <div className="mt-6 flex gap-4 text-sm text-primary-200">
        <Link to="/" className="transition-colors hover:text-white">
          Home
        </Link>
        <span className="text-primary-400">&middot;</span>
        <Link to="/terms" className="transition-colors hover:text-white">
          Terms
        </Link>
        <span className="text-primary-400">&middot;</span>
        <Link to="/privacy" className="transition-colors hover:text-white">
          Privacy
        </Link>
      </div>
    </div>
  )
}
