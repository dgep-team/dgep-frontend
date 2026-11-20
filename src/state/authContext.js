import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/**
 * The guest session: { guest, isLoggedIn, isGuestCheckout, login, register, logout, refresh }.
 * `isGuestCheckout` is a guest who booked without an account (token from POST /bookings).
 */
export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
