import { useEffect, useState } from 'react'

/**
 * Minutes left on an unpaid booking's room hold (holdExpiresAt).
 * Returns { expired, minutesLeft } or null when there is no hold.
 */
export function useHoldCountdown(holdExpiresAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!holdExpiresAt) return undefined
    const timer = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(timer)
  }, [holdExpiresAt])

  if (!holdExpiresAt) return null
  const msLeft = new Date(holdExpiresAt).getTime() - now
  return { expired: msLeft <= 0, minutesLeft: Math.max(0, Math.ceil(msLeft / 60_000)) }
}
