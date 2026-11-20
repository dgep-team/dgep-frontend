import { Building2 } from 'lucide-react'
import styles from './Brand.module.css'

export function Brand() {
  return (
    <div className={styles.brand}>
      <span className={styles.mark} aria-hidden="true">
        <Building2 size={22} />
      </span>
      <span className={styles.text}>
        <span className={styles.name}>StayEase</span>
        <span className={styles.tagline}>Book · Stay · Enjoy</span>
      </span>
    </div>
  )
}
