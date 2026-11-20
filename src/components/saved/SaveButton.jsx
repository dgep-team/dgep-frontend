import { Heart } from 'lucide-react'
import { useSaved } from '../../state/savedContext.js'
import styles from './SaveButton.module.css'

/**
 * Heart toggle for a room (`kind="room"`, needs hotel + roomType) or a hotel
 * (`kind="hotel"`, needs hotel). `variant`: 'overlay' sits on a photo,
 * 'inline' sits in text, with a visible label.
 */
export function SaveButton({ kind, hotel, roomType, variant = 'overlay', className = '' }) {
  const { isSaved, toggle } = useSaved()
  const saved = isSaved(kind, kind === 'room' ? roomType.id : hotel.id)
  const name = kind === 'room' ? `${roomType.name} at ${hotel.name}` : hotel.name

  return (
    <button
      type="button"
      className={`${styles.button} ${styles[variant]} ${saved ? styles.saved : ''} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from saved` : `Save ${name}`}
      title={saved ? 'Remove from saved' : 'Save for later'}
      onClick={(event) => {
        // Cards are often clickable; saving must not also open them.
        event.preventDefault()
        event.stopPropagation()
        toggle(kind, { hotel, roomType })
      }}
    >
      <Heart size={variant === 'overlay' ? 20 : 18} aria-hidden="true" />
      {variant === 'inline' && <span>{saved ? 'Saved' : 'Save'}</span>}
    </button>
  )
}
