import { CalendarDays, Minus, Plus, Users } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Card, Divider } from '../../../components/ui/Card.jsx'
import { addDays, adjustStay, formatDate, MAX_STAY_NIGHTS, pluralize, toIsoDate } from '../../../lib/dates.js'
import { DateField } from './DateField.jsx'
import styles from './BookingCards.module.css'

// The API accepts 1 to 10 guests per booking.
const API_MAX_GUESTS = 10

/**
 * Dates and party size. Tapping a date or "Edit" opens one editor for both.
 * `maxGuests` is the selected room type's capacity (omit on search).
 */
export function StayDetailsCard({ draft, maxGuests = API_MAX_GUESTS, onChange, disabled = false }) {
  const [editing, setEditing] = useState(false)
  const editorId = useId()
  const checkInRef = useRef(null)
  const checkOutRef = useRef(null)
  const today = toIsoDate(new Date())
  const guestLimit = Math.min(maxGuests, API_MAX_GUESTS)

  const openEditor = (focusField) => {
    if (disabled) return
    setEditing(true)
    const target = focusField === 'checkIn' ? checkInRef : focusField === 'checkOut' ? checkOutRef : null
    if (target) requestAnimationFrame(() => target.current?.focus())
  }

  const changeDate = (field) => (iso) => onChange(adjustStay(draft, { [field]: iso }, today))

  return (
    <Card aria-label="Stay details">
      <div className={styles.dates}>
        <DateItem label="Check-in" iso={draft.checkIn} onClick={() => openEditor('checkIn')} controls={editorId} expanded={editing} />
        <DateItem label="Check-out" iso={draft.checkOut} onClick={() => openEditor('checkOut')} controls={editorId} expanded={editing} />
      </div>
      <Divider />
      <div className={styles.guestsRow}>
        <Users size={22} className={styles.rowIcon} aria-hidden="true" />
        <div className={styles.grow}>
          <p className={styles.label}>Guests</p>
          <p className={styles.value}>{pluralize(draft.guests, 'Guest')}</p>
        </div>
        <button
          type="button"
          className={styles.linkButton}
          aria-expanded={editing}
          aria-controls={editorId}
          disabled={disabled}
          onClick={() => (editing ? setEditing(false) : openEditor())}
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {editing && (
        <div id={editorId} className={styles.editor}>
          <div className={styles.dateInputs}>
            <DateField inputRef={checkInRef} label="Check-in" min={today} value={draft.checkIn} onCommit={changeDate('checkIn')} />
            <DateField
              inputRef={checkOutRef}
              label="Check-out"
              min={addDays(draft.checkIn, 1)}
              max={addDays(draft.checkIn, MAX_STAY_NIGHTS)}
              value={draft.checkOut}
              onCommit={changeDate('checkOut')}
              hint={`Stays of up to ${MAX_STAY_NIGHTS} nights.`}
            />
          </div>
          <Stepper
            label="Guests"
            hint={maxGuests < API_MAX_GUESTS ? `Up to ${maxGuests} in this room` : undefined}
            value={draft.guests}
            min={1}
            max={guestLimit}
            onChange={(guests) => onChange({ guests })}
          />
        </div>
      )}
    </Card>
  )
}

function DateItem({ label, iso, onClick, controls, expanded }) {
  return (
    <button type="button" className={styles.dateItem} onClick={onClick} aria-controls={controls} aria-expanded={expanded}>
      <CalendarDays size={22} className={styles.rowIcon} aria-hidden="true" />
      <span>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>
          <time dateTime={iso}>{formatDate(iso)}</time>
        </span>
        <span className="visually-hidden">, change date</span>
      </span>
    </button>
  )
}

function Stepper({ label, hint, value, min, max, onChange }) {
  return (
    <div className={styles.stepper}>
      <div>
        <p className={styles.value}>{label}</p>
        {hint && <p className={styles.label}>{hint}</p>}
      </div>
      <div className={styles.stepperControls}>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => onChange(value - 1)}
          disabled={value <= min}
          aria-label={`Fewer ${label.toLowerCase()}`}
        >
          <Minus size={18} aria-hidden="true" />
        </button>
        <output className={styles.stepValue} aria-live="polite" aria-label={`${value} ${label.toLowerCase()}`}>
          {value}
        </output>
        <button
          type="button"
          className={styles.stepButton}
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`More ${label.toLowerCase()}`}
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
