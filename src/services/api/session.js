// Access tokens, one per realm: guests and hotel staff log in separately and
// their tokens must never be mixed (every /admin endpoint needs a staff token).
//
// Tokens last 7 days, so they live in localStorage: a guest sent to Paystack
// comes back in the same tab and must still be logged in to verify payment.
// Storage can be blocked (private mode); then the session lasts for this tab.

export const REALMS = { guest: 'guest', staff: 'staff' }

const KEYS = { guest: 'stayease.session.guest', staff: 'stayease.session.staff' }
const memory = { guest: null, staff: null }
const listeners = new Set()

function read(realm) {
  try {
    const raw = window.localStorage.getItem(KEYS[realm])
    if (raw) return JSON.parse(raw)
  } catch {
    // Fall through to the in-memory copy.
  }
  return memory[realm]
}

function write(realm, session) {
  memory[realm] = session
  try {
    if (session) window.localStorage.setItem(KEYS[realm], JSON.stringify(session))
    else window.localStorage.removeItem(KEYS[realm])
  } catch {
    // The in-memory copy still works for this tab.
  }
  listeners.forEach((listener) => listener(realm, session))
}

export const session = {
  /** { accessToken, user, source } or null. `source` is 'login' | 'register' | 'guest-checkout'. */
  get: (realm = REALMS.guest) => read(realm),
  token: (realm = REALMS.guest) => read(realm)?.accessToken ?? null,
  set: (realm, value) => write(realm, value),
  /** Updates the stored user (e.g. after PATCH /me) without touching the token. */
  updateUser(realm, user) {
    const current = read(realm)
    if (current) write(realm, { ...current, user: { ...current.user, ...user } })
  },
  clear: (realm = REALMS.guest) => write(realm, null),
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

// Another tab logging in or out keeps this one in step.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    const realm = Object.keys(KEYS).find((key) => KEYS[key] === event.key)
    if (!realm) return
    let value = null
    try {
      value = event.newValue ? JSON.parse(event.newValue) : null
    } catch {
      value = null
    }
    memory[realm] = value
    listeners.forEach((listener) => listener(realm, value))
  })
}
