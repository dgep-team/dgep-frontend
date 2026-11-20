import { api } from './api/client.js'
import { REALMS, session } from './api/session.js'

function startSession(realm, { accessToken, guest, staff }, source) {
  const user = guest ?? staff
  session.set(realm, { accessToken, user, source })
  return user
}

/** POST /auth/login -> the guest. Throws INVALID_LOGIN on wrong credentials. */
export async function login({ email, password }) {
  const data = await api.post('/auth/login', { email: email.trim(), password }, { auth: false })
  return startSession(REALMS.guest, data, 'login')
}

/** POST /auth/register -> the guest, logged in straight away. Throws ALREADY_EXISTS. */
export async function register({ email, password, firstName, lastName, phone }) {
  const body = { email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() }
  if (phone?.trim()) body.phone = phone.trim()
  const data = await api.post('/auth/register', body, { auth: false })
  return startSession(REALMS.guest, data, 'register')
}

/** Keeps the token a booking without an account returns (needed to pay and check in). */
export function startGuestCheckoutSession({ accessToken, guest }) {
  session.set(REALMS.guest, { accessToken, user: guest ?? null, source: 'guest-checkout' })
}

export function logout() {
  session.clear(REALMS.guest)
}

/** GET /me */
export async function getMe({ signal } = {}) {
  const guest = await api.get('/me', { signal })
  session.updateUser(REALMS.guest, guest)
  return guest
}

/** PATCH /me with any of firstName, lastName, phone. */
export async function updateMe(changes) {
  const guest = await api.patch('/me', changes)
  session.updateUser(REALMS.guest, guest)
  return guest
}

/**
 * POST /auth/password. A guest who booked without an account sets a first
 * password with no currentPassword; changing one needs currentPassword.
 */
export async function setPassword({ password, currentPassword }) {
  const body = { password }
  if (currentPassword) body.currentPassword = currentPassword
  await api.post('/auth/password', body)
  const current = session.get(REALMS.guest)
  if (current?.source === 'guest-checkout') session.set(REALMS.guest, { ...current, source: 'login' })
}
