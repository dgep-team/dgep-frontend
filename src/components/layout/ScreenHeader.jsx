import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router'
import styles from './ScreenHeader.module.css'

/**
 * Top bar with a back button. Goes back in history when there is somewhere
 * to go; otherwise to `backTo`, so a deep link never strands the guest.
 *
 * `center` replaces the title (e.g. the brand on Booking Details). From
 * 768px the top nav already shows brand and profile, so `center` and
 * `right` are hidden there and only the back button and title remain.
 */
export function ScreenHeader({ title, center, right, backTo = '/' }) {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(backTo, { replace: true })
  }

  return (
    <header className={styles.header}>
      <button type="button" className={styles.iconButton} onClick={goBack} aria-label="Go back">
        <ChevronLeft size={26} aria-hidden="true" />
      </button>
      {center ? (
        <div className={`${styles.center} ${styles.mobileOnly}`}>{center}</div>
      ) : (
        <div className={styles.center}>
          <h1 className={styles.title}>{title}</h1>
        </div>
      )}
      <div className={`${styles.right} ${styles.mobileOnly}`}>{right}</div>
    </header>
  )
}
