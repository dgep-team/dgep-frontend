import { Outlet, ScrollRestoration } from 'react-router'
import { BottomNav } from './BottomNav.jsx'
import { TopNav } from './TopNav.jsx'
import styles from './AppShell.module.css'

/**
 * App frame. Phones get a bottom tab bar; from 768px a top nav replaces it
 * and content widens (see breakpoints in styles/tokens.css).
 */
export function AppShell() {
  return (
    <div className={styles.shell}>
      <TopNav />
      <Outlet />
      <BottomNav />
      {/* New screens open at the top; Back returns to the previous scroll position. */}
      <ScrollRestoration />
    </div>
  )
}

/** Standard screen: a header row, then the page content in a centred column. */
export function Screen({ header, children, labelledBy, width = 'wide' }) {
  return (
    <div className={`${styles.screen} ${styles[width]}`}>
      {header}
      <main className={styles.main} aria-labelledby={labelledBy}>
        {children}
      </main>
    </div>
  )
}

/**
 * Two columns from 1024px: `children` on the left, a sticky `aside` on the
 * right. Below that it stacks, with the aside after the content unless
 * `asideFirst` is set.
 */
export function SplitLayout({ children, aside, asideLabel, asideFirst = false }) {
  return (
    <div className={`${styles.split} ${asideFirst ? styles.asideFirst : ''}`}>
      <div className={styles.column}>{children}</div>
      <aside className={styles.aside} aria-label={asideLabel}>
        {aside}
      </aside>
    </div>
  )
}
