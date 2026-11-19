import { useCallback, useEffect, useState } from 'react'

/**
 * Runs `load` whenever `key` changes and tracks its result.
 * `key` must be a string (or number) that changes exactly when `load` should re-run.
 * Returns { status: 'loading' | 'success' | 'error', data, error, setData }.
 */
export function useAsync(load, key) {
  const [result, setResult] = useState({ key: null })

  useEffect(() => {
    let active = true
    load().then(
      (data) => active && setResult({ key, data }),
      (error) => active && setResult({ key, error }),
    )
    return () => {
      active = false
    }
    // `key` is the declared trigger; `load` is a fresh closure every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setData = useCallback((data) => setResult({ key, data }), [key])

  if (result.key !== key) return { status: 'loading', setData }
  if (result.error) return { status: 'error', error: result.error, setData }
  return { status: 'success', data: result.data, setData }
}
