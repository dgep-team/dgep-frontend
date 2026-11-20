import { useEffect } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../../state/authContext.js'

/**
 * /logout: outside the auth guard, so clearing the session here can't race
 * a guarded screen into redirecting to /login.
 */
export function LogoutRoute() {
  const { logout } = useAuth()
  useEffect(() => {
    logout()
  }, [logout])
  return <Navigate to="/home" replace />
}
