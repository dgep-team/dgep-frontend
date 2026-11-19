import { Mail, Phone, User, UserRound } from 'lucide-react'
import { Card } from '../../../components/ui/Card.jsx'
import styles from './CheckIn.module.css'

export function GuestInfoCard({ guest }) {
  return (
    <Card tone="muted" aria-labelledby="guest-info-heading">
      <h2 id="guest-info-heading" className={styles.cardTitle}>
        <User size={22} className={styles.icon} aria-hidden="true" />
        Guest Information
      </h2>
      <ul className={styles.infoList}>
        <li>
          <UserRound size={18} className={styles.icon} aria-hidden="true" />
          <span className="visually-hidden">Name: </span>
          {guest.fullName}
        </li>
        <li>
          <Phone size={18} className={styles.icon} aria-hidden="true" />
          <span className="visually-hidden">Phone: </span>
          {guest.phone}
        </li>
        <li>
          <Mail size={18} className={styles.icon} aria-hidden="true" />
          <span className="visually-hidden">Email: </span>
          {guest.email}
        </li>
      </ul>
    </Card>
  )
}
