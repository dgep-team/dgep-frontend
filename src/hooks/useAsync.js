import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `load(signal)` whenever `key` changes (or `reload()` is called) and
 * tracks its result. The previous request is aborted when the key changes
 * or the component unmounts. Pass `key = null` to skip loading.
 *
 * Returns { status: 'idle' | 'loading' | 'success' | 'error', data, error, setData, reload }.
 */
export function useAsync(load, key) {
  const [result, setResult] = useState({ key: undefined })
  const [version, setVersion] = useState(0)
  const runKey = key === null ? null : `${key}#${version}`

  useEffect(() => {
    if (runKey === null) return undefined
    const controller = new AbortController()
    load(controller.signal).then(
      (data) => !controller.signal.aborted && setResult({ key: runKey, data }),
      (error) => !controller.signal.aborted && setResult({ key: runKey, error }),
    )
    return () => controller.abort()
    // `key` is the declared trigger; `load` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey])

  const setData = useCallback((data) => setResult({ key: runKey, data }), [runKey])
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  if (runKey === null) return { status: 'idle', setData, reload }
  if (result.key !== runKey) return { status: 'loading', setData, reload }
  if (result.error) return { status: 'error', error: result.error, setData, reload }
  return { status: 'success', data: result.data, setData, reload }
}
