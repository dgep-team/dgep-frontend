import { Link, NavLink, useLocation } from 'react-router'
import { Brand } from './Brand.jsx'
import { isNavItemActive, NAV_ITEMS } from './navItems.js'
import styles from './TopNav.module.css'

/** Tablet and desktop navigation (768px and up). */
export function TopNav() {
  const { pathname } = useLocation()

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link to="/home" className={styles.brandLink} aria-label="StayEase home">
          <Brand />
        </Link>
        <nav aria-label="Main">
          <ul className={styles.list}>
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item, pathname)
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={`${styles.link} ${active ? styles.active : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
