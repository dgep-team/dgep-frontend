import { Navigate, Outlet, useLocation } from 'react-router'
import { loginUrl } from '../../lib/redirect.js'
import { useStaffSession } from '../../state/useStaffSession.js'

/** Guards the hotel dashboard: every /admin endpoint needs a staff token. */
export function RequireStaff() {
  const { isLoggedIn } = useStaffSession()
  const location = useLocation()

  if (!isLoggedIn) return <Navigate to={loginUrl(`${location.pathname}${location.search}`, '/admin/login')} replace />
  return <Outlet />
}
