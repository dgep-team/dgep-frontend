import { Lock, LockOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { errorMessage } from '../../services/api/errors.js'
import { getArrivalInfo, getBooking } from '../../services/bookingService.js'
import { isKeyActive, unlockDoor } from '../../services/mock/doorKeyService.js'
import styles from './DigitalKeyPage.module.css'

async function loadKey(bookingId, signal) {
  const [booking, arrival] = await Promise.all([
    getBooking(bookingId, { signal }),
    getArrivalInfo(bookingId, { signal }).catch(() => null),
  ])
  return { booking, arrival }
}

/**
 * Digital Key. Unlocking is MOCKED (services/mock/doorKeyService.js): the API
 * has no door endpoint yet. The key turns on once the guest is checked in at
 * the hotel, which is also when the room number is assigned.
 */
export function DigitalKeyPage() {
  const { bookingId } = useParams()
  const page = useAsync((signal) => loadKey(bookingId, signal), bookingId)
  // idle -> unlocking -> unlocked -> (a few seconds) -> idle
  const [door, setDoor] = useState({ status: 'idle' })

  useEffect(() => {
    if (door.status !== 'unlocked') return undefined
    const timer = setTimeout(() => setDoor({ status: 'idle' }), door.relockAfterSeconds * 1000)
    return () => clearTimeout(timer)
  }, [door])

  const header = <ScreenHeader title="Your Digital Key" backTo={`/bookings/${bookingId}`} />

  if (page.status === 'loading') {
    return (
      <Screen header={header} width="narrow">
        <LoadingView label="Loading your key…" />
      </Screen>
    )
  }
  if (page.status === 'error') {
    return (
      <Screen header={header} width="narrow">
        <ErrorView message={errorMessage(page.error)} actionLabel="View my bookings" actionTo="/bookings" />
      </Screen>
    )
  }

  const { booking, arrival } = page.data
  const active = isKeyActive(booking)
  const roomNumber = arrival?.roomNumber
  const unlocked = door.status === 'unlocked'
  const unlocking = door.status === 'unlocking'

  const open = async () => {
    setDoor({ status: 'unlocking' })
    try {
      const result = await unlockDoor(bookingId)
      setDoor({ status: 'unlocked', relockAfterSeconds: result.relockAfterSeconds })
    } catch {
      setDoor({ status: 'error' })
    }
  }

  return (
    <Screen header={header} width="narrow">
      <div className={styles.panel} data-state={unlocked ? 'unlocked' : active ? 'ready' : 'inactive'}>
        <button
          type="button"
          className={styles.lockButton}
          onClick={open}
          disabled={!active || unlocking || unlocked}
          aria-label={unlocked ? 'Door unlocked' : 'Unlock your room'}
        >
          <span className={styles.ring} aria-hidden="true">
            <span className={styles.core}>{unlocked ? <LockOpen size={36} /> : <Lock size={36} />}</span>
          </span>
        </button>
      </div>

      <div className={styles.text} aria-live="polite">
        <p className={styles.room}>{roomNumber ? `Room ${roomNumber}` : booking.room?.roomType?.name ?? 'Your room'}</p>
        <p className={styles.hint}>
          {!active
            ? 'Your key turns on once you’re checked in at the hotel and your room is assigned.'
            : unlocking
              ? 'Unlocking…'
              : unlocked
                ? 'Door unlocked. It locks again in a few seconds.'
                : 'Tap to unlock your room'}
        </p>
      </div>

      {door.status === 'error' && <Alert tone="error" title="The door didn’t open. Please try again, or ask the front desk." />}

      <Button fullWidth onClick={open} disabled={!active || unlocked} loading={unlocking} loadingLabel="Unlocking…">
        Open Door
      </Button>
      <p className={styles.mockNote}>Preview: the door connection is simulated for now.</p>
    </Screen>
  )
}
