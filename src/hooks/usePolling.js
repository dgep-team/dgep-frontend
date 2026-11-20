import { useEffect, useRef } from 'react'

/**
 * Calls `tick()` every `intervalMs` while `enabled`, for keeping a screen
 * current (e.g. a request's status). Pauses while the tab is hidden; on
 * returning to the tab it ticks straight away if the last tick is at least
 * one interval old. Never more than one tick per interval, however often
 * the tab is shown and hidden.
 */
export function usePolling(tick, { intervalMs, enabled }) {
  const latest = useRef(tick)
  useEffect(() => {
    latest.current = tick
  })

  useEffect(() => {
    if (!enabled) return undefined
    let lastTick = Date.now() // the screen has just loaded its data
    const visible = () => document.visibilityState === 'visible'
    const run = () => {
      lastTick = Date.now()
      latest.current()
    }

    const timer = setInterval(() => {
      if (visible() && Date.now() - lastTick >= intervalMs - 50) run()
    }, intervalMs)
    const onVisibility = () => {
      if (visible() && Date.now() - lastTick >= intervalMs) run()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, intervalMs])
}
