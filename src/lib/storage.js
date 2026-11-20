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
