// Every service goes through here. Today it simulates network latency over
// in-memory data; swapping in real HTTP calls should only touch the services.

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'unknown' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function simulateRequest(produce, latencyMs = 350) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(structuredClone(produce()))
      } catch (error) {
        reject(error)
      }
    }, latencyMs)
  })
}

/** sessionStorage wrapper that never throws (private mode, blocked storage). */
export const sessionStore = {
  read(key, fallback) {
    try {
      const raw = window.sessionStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },
  write(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Persistence is a convenience; the app works without it.
    }
  },
}
