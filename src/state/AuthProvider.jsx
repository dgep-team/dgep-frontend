import { useCallback, useEffect, useMemo, useState } from 'react'
import { REALMS, session } from '../services/api/session.js'
import * as auth from '../services/authService.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [current, setCurrent] = useState(() => session.get(REALMS.guest))

  // Follows every change: login, logout, a 401 clearing the token, other tabs.
  useEffect(
    () =>
      session.subscribe((realm, value) => {
        if (realm === REALMS.guest) setCurrent(value)
      }),
    [],
  )

  const refresh = useCallback(() => auth.getMe().catch(() => null), [])

  // A guest-checkout session may not know the guest's id or name yet.
  const token = current?.accessToken
  const needsProfile = Boolean(token && !current?.user?.id)
  useEffect(() => {
    if (needsProfile) refresh()
  }, [needsProfile, refresh])

  const value = useMemo(
    () => ({
      guest: current?.user ?? null,
      isLoggedIn: Boolean(token),
      isGuestCheckout: current?.source === 'guest-checkout',
      login: auth.login,
      register: auth.register,
      logout: auth.logout,
      refresh,
    }),
    [current, token, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
