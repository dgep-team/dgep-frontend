import { useEffect, useState } from 'react'
import { REALMS, session } from '../services/api/session.js'

/**
 * The hotel staff session (separate from the guest one). Follows login,
 * logout, a 401 clearing the token, and other tabs.
 */
export function useStaffSession() {
  const [current, setCurrent] = useState(() => session.get(REALMS.staff))

  useEffect(
    () =>
      session.subscribe((realm, value) => {
        if (realm === REALMS.staff) setCurrent(value)
      }),
    [],
  )

  return { staff: current?.user ?? null, isLoggedIn: Boolean(current?.accessToken) }
}
