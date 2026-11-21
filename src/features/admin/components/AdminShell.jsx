import { ChevronLeft, ClipboardList, Ellipsis, House, Users } from 'lucide-react'
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { Brand } from '../../../components/layout/Brand.jsx'
import styles from './AdminShell.module.css'

// Staff destinations. `end` keeps Dashboard from matching every /admin path.
const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: House, end: true },
  { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/admin/guests', label: 'Guests', icon: Users },
  { to: '/admin/more', label: 'More', icon: Ellipsis },
]

/**
 * Frame for the hotel staff screens, separate from the guest AppShell:
 * a bottom tab bar on phones, a top bar from 768px.
 */
export function AdminShell() {
  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.topInner}>
          <Brand />
          <span className={styles.badge}>Staff</span>
          <AdminNavList className={styles.topList} linkClass={styles.topLink} />
        </div>
      </header>
      <Outlet />
      <nav className={styles.bottomNav} aria-label="Staff">
        <AdminNavList className={styles.bottomList} linkClass={styles.bottomLink} />
      </nav>
      <ScrollRestoration />
    </div>
  )
}

function AdminNavList({ className, linkClass }) {
  return (
    <ul className={className}>
      {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink to={to} end={end} className={({ isActive }) => `${linkClass} ${isActive ? styles.active : ''}`}>
            <Icon size={22} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

/** Staff screen: a title row (with Back when `backTo` is set), then the content. */
export function AdminScreen({ title, backTo, right, children }) {
  return (
    <div className={styles.screen}>
      <AdminHeader title={title} backTo={backTo} right={right} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}

function AdminHeader({ title, backTo, right }) {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => {
    if (window.history.state?.idx > 0 && location.key !== 'default') navigate(-1)
    else navigate(backTo, { replace: true })
  }

  return (
    <header className={styles.header}>
      {backTo ? (
        <button type="button" className={styles.iconButton} onClick={goBack} aria-label="Go back">
          <ChevronLeft size={26} aria-hidden="true" />
        </button>
      ) : (
        <span className={styles.headerSpacer} aria-hidden="true" />
      )}
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.headerRight}>{right}</div>
    </header>
  )
}
