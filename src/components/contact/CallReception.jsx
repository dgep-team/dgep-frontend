import { Phone } from 'lucide-react'
import { telHref } from '../../lib/phone.js'
import styles from './CallReception.module.css'

/**
 * Tap-to-call the hotel's front desk (PRD IS-05). Renders nothing without a
 * number. `variant`: 'card' (a strip with a prompt) or 'button' (one full-width button).
 */
export function CallReception({ phone, hotelName, variant = 'card' }) {
  const href = telHref(phone)
  if (!href) return null
  const label = hotelName ? `Call ${hotelName} reception` : 'Call reception'

  if (variant === 'button') {
    return (
      <a href={href} className={styles.button} aria-label={`${label}, ${phone}`}>
        <Phone size={18} aria-hidden="true" />
        Call reception
      </a>
    )
  }

  return (
    <div className={styles.card}>
      <span className={styles.icon} aria-hidden="true">
        <Phone size={20} />
      </span>
      <div className={styles.text}>
        <p className={styles.title}>Need it urgently?</p>
        <p className={styles.muted}>Reception can help right away.</p>
      </div>
      <a href={href} className={styles.call} aria-label={`${label}, ${phone}`}>
        Call
      </a>
    </div>
  )
}
