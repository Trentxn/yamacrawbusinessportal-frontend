import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function AccountRedirect() {
  const { user } = useAuth()
  const isAdminRole = user?.role === 'admin' || user?.role === 'system_admin'
  return <Navigate to={isAdminRole ? 'profile' : 'inquiries'} replace />
}
