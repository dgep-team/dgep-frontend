import { NavLink, useLocation } from 'react-router'
import { isNavItemActive, NAV_ITEMS } from './navItems.js'
import styles from './BottomNav.module.css'

/** Phone tab bar. Hidden from 768px, where TopNav takes over. */
export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className={styles.nav} aria-label="Main">
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
                <Icon size={22} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
