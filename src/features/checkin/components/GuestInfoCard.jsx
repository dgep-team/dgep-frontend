import { Mail, Phone, User, UserRound } from 'lucide-react'
import { Card } from '../../../components/ui/Card.jsx'
import { TextField } from '../../../components/ui/TextField.jsx'
import styles from './CheckIn.module.css'

/**
 * The guest's details from GET /me. With `editing`, name and phone can be
 * corrected; changes go to the hotel with check-in (`guest` on the request).
 */
export function GuestInfoCard({ guest, editing, edits, onEditsChange, onToggleEdit, errors = {}, disabled }) {
  const set = (field) => (event) => onEditsChange({ ...edits, [field]: event.target.value })
  const fullName = [guest.firstName, guest.lastName].filter(Boolean).join(' ')

  return (
    <Card tone="muted" aria-labelledby="guest-info-heading">
      <div className={styles.cardHead}>
        <h2 id="guest-info-heading" className={styles.cardTitle}>
          <User size={22} className={styles.icon} aria-hidden="true" />
          Guest Information
        </h2>
        <button type="button" className={styles.linkButton} onClick={onToggleEdit} disabled={disabled} aria-expanded={editing}>
          {editing ? 'Keep as is' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className={styles.fieldset}>
          <TextField label="First name" autoComplete="given-name" value={edits.firstName} onChange={set('firstName')} error={errors['guest.firstName']} disabled={disabled} />
          <TextField label="Last name" autoComplete="family-name" value={edits.lastName} onChange={set('lastName')} error={errors['guest.lastName']} disabled={disabled} />
          <TextField label="Phone" type="tel" autoComplete="tel" value={edits.phone} onChange={set('phone')} error={errors['guest.phone']} disabled={disabled} />
        </div>
      ) : (
        <ul className={styles.infoList}>
          <li>
            <UserRound size={18} className={styles.icon} aria-hidden="true" />
            <span className="visually-hidden">Name: </span>
            {fullName || '—'}
          </li>
          <li>
            <Phone size={18} className={styles.icon} aria-hidden="true" />
            <span className="visually-hidden">Phone: </span>
            {guest.phone || 'No phone number'}
          </li>
          <li>
            <Mail size={18} className={styles.icon} aria-hidden="true" />
            <span className="visually-hidden">Email: </span>
            {guest.email}
          </li>
        </ul>
      )}
    </Card>
  )
}
