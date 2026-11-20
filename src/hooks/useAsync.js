import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `load(signal)` whenever `key` changes (or `reload()` is called) and
 * tracks its result. The previous request is aborted when the key changes
 * or the component unmounts. Pass `key = null` to skip loading.
 *
 * `reload()` shows the loading state again. `refresh()` is quiet: the current
 * data stays on screen while it fetches, and is kept if the fetch fails.
 * Use it for polling and background updates.
 *
 * Returns { status: 'idle' | 'loading' | 'success' | 'error', data, error,
 *           refreshing, setData, reload, refresh }.
 */
export function useAsync(load, key) {
  const [result, setResult] = useState({ key: undefined })
  const [run, setRun] = useState({ n: 0, quiet: false })
  const runKey = key === null ? null : `${key}#${run.n}`

  useEffect(() => {
    if (runKey === null) return undefined
    const controller = new AbortController()
    load(controller.signal).then(
      (data) => !controller.signal.aborted && setResult({ key: runKey, data }),
      (error) => {
        if (controller.signal.aborted) return
        // A failed quiet refresh keeps what the guest is looking at.
        setResult((previous) =>
          run.quiet && 'data' in previous && !previous.error ? { ...previous, key: runKey } : { key: runKey, error },
        )
      },
    )
    return () => controller.abort()
    // `key` is the declared trigger; `load` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey])

  const setData = useCallback((data) => setResult({ key: runKey, data }), [runKey])
  const reload = useCallback(() => setRun((current) => ({ n: current.n + 1, quiet: false })), [])
  const refresh = useCallback(() => setRun((current) => ({ n: current.n + 1, quiet: true })), [])
  const controls = { setData, reload, refresh }

  if (runKey === null) return { status: 'idle', ...controls }
  if (result.key !== runKey) {
    // Quiet refresh in flight: keep showing the last data for this key.
    const sameKey = typeof result.key === 'string' && result.key.slice(0, result.key.lastIndexOf('#')) === String(key)
    if (run.quiet && sameKey && 'data' in result && !result.error) {
      return { status: 'success', data: result.data, refreshing: true, ...controls }
    }
    return { status: 'loading', ...controls }
  }
  if (result.error) return { status: 'error', error: result.error, ...controls }
  return { status: 'success', data: result.data, refreshing: false, ...controls }
}
