import { useLocation } from 'react-router-dom'

export function useAdminBasePath() {
  const { pathname } = useLocation()
  return pathname.startsWith('/system') ? '/system' : '/admin'
}
