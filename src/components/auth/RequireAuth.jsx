import { Navigate, Outlet, useLocation } from 'react-router'
import { loginUrl } from '../../lib/redirect.js'
import { useAuth } from '../../state/authContext.js'

/**
 * Guards screens that call endpoints marked Auth = Yes. Without a token (or
 * once a 401 clears it) the guest goes to log in and comes back here after.
 */
export function RequireAuth() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) return <Navigate to={loginUrl(`${location.pathname}${location.search}`)} replace />
  return <Outlet />
}
