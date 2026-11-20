import { Mail, Phone, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { Card } from '../../../components/ui/Card.jsx'
import { TextField } from '../../../components/ui/TextField.jsx'
import { loginUrl } from '../../../lib/redirect.js'
import styles from './BookingCards.module.css'

/** Contact details for booking without an account (sent as `guest` on POST /bookings). */
export function GuestDetailsCard({ value, onChange, errors, disabled }) {
  const set = (field) => (event) => onChange({ ...value, [field]: event.target.value })

  return (
    <Card aria-labelledby="guest-details-heading">
      <div className={styles.guestForm}>
        <div>
          <h2 id="guest-details-heading" className={styles.value}>
            Your details
          </h2>
          <p className={styles.label}>
            Have an account? <Link to={loginUrl('/booking')}>Log in</Link> to book faster.
          </p>
        </div>
        <div className={styles.guestRow}>
          <TextField
            label="First name"
            icon={UserRound}
            autoComplete="given-name"
            value={value.firstName}
            onChange={set('firstName')}
            error={errors['guest.firstName']}
            disabled={disabled}
          />
          <TextField
            label="Last name"
            autoComplete="family-name"
            value={value.lastName}
            onChange={set('lastName')}
            error={errors['guest.lastName']}
            disabled={disabled}
          />
        </div>
        <TextField
          label="Email"
          type="email"
          icon={Mail}
          autoComplete="email"
          value={value.email}
          onChange={set('email')}
          error={errors['guest.email']}
          hint="We send your booking confirmation here."
          disabled={disabled}
        />
        <TextField
          label="Phone (optional)"
          type="tel"
          icon={Phone}
          autoComplete="tel"
          placeholder="+2348012345678"
          value={value.phone}
          onChange={set('phone')}
          error={errors['guest.phone']}
          disabled={disabled}
        />
      </div>
    </Card>
  )
}
