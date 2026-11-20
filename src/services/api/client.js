import { ApiError, ERROR_CODES } from './errors.js'
import { REALMS, session } from './session.js'

// Base URL including /api/v1, e.g. https://dgep-backend-staging.onrender.com/api/v1
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://dgep-backend-staging.onrender.com/api/v1').replace(
  /\/+$/,
  '',
)

// Staging runs on a free Render instance that can take ~50s to wake up, so
// the timeout is generous. A caller's AbortSignal still cancels immediately.
const TIMEOUT_MS = 60_000

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url
}

async function readEnvelope(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    // An HTML error page (proxy, cold start) rather than a DGEP envelope.
    throw new ApiError('Unexpected response from the server.', { status: response.status, code: ERROR_CODES.BAD_RESPONSE })
  }
}

/**
 * Calls the DGEP API and returns `data` from `{ success: true, data }`.
 * Throws ApiError with the server's `code`, `message` and `details` otherwise.
 *
 * auth: 'guest' | 'staff' sends that realm's Bearer token (required);
 *       'optional' sends the guest token only if there is one;
 *       false sends none.
 */
export async function request(path, { method = 'GET', query, body, auth = REALMS.guest, signal } = {}) {
  const realm = auth === 'optional' ? REALMS.guest : auth
  const token = realm ? session.token(realm) : null

  if (auth && auth !== 'optional' && !token) {
    throw new ApiError('Please log in', { status: 401, code: ERROR_CODES.UNAUTHORIZED })
  }

  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: combined,
    })
  } catch (error) {
    if (signal?.aborted) throw error // the caller cancelled; let them see the AbortError
    if (timeout.aborted) throw new ApiError('Request timed out', { code: ERROR_CODES.TIMEOUT })
    throw new ApiError('Network error', { code: ERROR_CODES.NETWORK_ERROR })
  }

  const envelope = await readEnvelope(response)

  if (response.ok && envelope?.success !== false) return envelope?.data ?? null

  const error = envelope?.error ?? {}
  const apiError = new ApiError(error.message || response.statusText || 'Request failed', {
    status: response.status,
    code: error.code || (response.status >= 500 ? ERROR_CODES.INTERNAL_ERROR : ERROR_CODES.BAD_RESPONSE),
    details: error.details ?? [],
  })

  // An expired or revoked token: drop it so the app sends the user to log in.
  // (INVALID_LOGIN is also a 401 but means wrong credentials, not a dead session.)
  if (token && apiError.code === ERROR_CODES.UNAUTHORIZED) session.clear(realm)

  throw apiError
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body: body ?? {} }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body: body ?? {} }),
}

/** GET /health (outside /api/v1). Resolves true when the API is up. */
export async function checkHealth({ signal } = {}) {
  const origin = new URL(API_BASE_URL).origin
  try {
    const response = await fetch(`${origin}/health`, { signal })
    const body = await response.json()
    return body?.data?.status === 'ok'
  } catch {
    return false
  }
}
