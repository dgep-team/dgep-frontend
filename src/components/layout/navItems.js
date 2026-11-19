import { CalendarCheck, Heart, House, Search, User } from 'lucide-react'

// Main destinations, shared by the phone tab bar and the wide-screen top nav.
// `match` lists the path prefixes that mark a tab active: the booking flow
// (/booking/...) belongs to Bookings alongside /bookings.
export const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: House, match: ['/home'] },
  { to: '/search', label: 'Search', icon: Search, match: ['/search'] },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck, match: ['/booking', '/bookings'] },
  { to: '/saved', label: 'Saved', icon: Heart, match: ['/saved'] },
  { to: '/profile', label: 'Profile', icon: User, match: ['/profile'] },
]

export function isNavItemActive(item, pathname) {
  return item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
