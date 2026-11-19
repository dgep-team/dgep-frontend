import { Check } from 'lucide-react'
import styles from './CheckIn.module.css'

export function CheckInHero({ title, subtitle }) {
  return (
    <div className={styles.hero}>
      <div className={styles.badgeWrap} aria-hidden="true">
        <span className={styles.ray} data-side="left" />
        <span className={styles.badge}>
          <Check size={40} strokeWidth={3} />
        </span>
        <span className={styles.ray} data-side="right" />
      </div>
      <h1 className={styles.heroTitle}>{title}</h1>
      <p className={styles.heroSubtitle}>{subtitle}</p>
    </div>
  )
}
