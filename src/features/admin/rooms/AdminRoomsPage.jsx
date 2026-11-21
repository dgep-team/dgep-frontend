import { DoorOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../../components/feedback/StatusView.jsx'
import { Button } from '../../../components/ui/Button.jsx'
import { Card } from '../../../components/ui/Card.jsx'
import { SelectField } from '../../../components/ui/SelectField.jsx'
import { TextField } from '../../../components/ui/TextField.jsx'
import { useAsync } from '../../../hooks/useAsync.js'
import { addDays, formatDate, stayDate, toIsoDate } from '../../../lib/dates.js'
import { createRoom, getRoomAvailability, listRoomTypes } from '../../../services/adminService.js'
import { ERROR_CODES, errorMessage, fieldErrors } from '../../../services/api/errors.js'
import { useStaffSession } from '../../../state/useStaffSession.js'
import { asList, can, personName, shortStayLabel } from '../adminData.js'
import { AdminScreen } from '../components/AdminShell.jsx'
import styles from '../components/AdminList.module.css'

const roomBookings = (room) => asList(room.bookings ?? room.bookedDates ?? [])
const roomTypeName = (room) => room.roomType?.name ?? room.roomTypeName ?? room.type ?? null

/** Rooms and their booked dates between two days: GET /admin/rooms/availability. Managers can add rooms. */
export function AdminRoomsPage() {
  const { staff } = useStaffSession()
  const today = toIsoDate(new Date())
  const [range, setRange] = useState({ from: today, to: addDays(today, 7) })
  const [adding, setAdding] = useState(false)
  const validRange = range.from && range.to && range.from < range.to
  const page = useAsync(
    (signal) => getRoomAvailability({ ...range, signal }).then(asList),
    validRange ? `${range.from}:${range.to}` : null,
  )

  const rooms = page.status === 'success' ? [...page.data].sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true })) : []
  const free = rooms.filter((room) => roomBookings(room).length === 0).length

  return (
    <AdminScreen title="Rooms" backTo="/admin/more">
      {can(staff, 'manageHotel') &&
        (adding ? (
          <AddRoomCard
            onDone={(added) => {
              setAdding(false)
              if (added) page.reload()
            }}
          />
        ) : (
          <Button variant="secondary" onClick={() => setAdding(true)} iconRight={<Plus size={18} aria-hidden="true" />}>
            Add room
          </Button>
        ))}

      <div className={styles.dateRow}>
        <TextField label="From" type="date" value={range.from} onChange={(event) => setRange((r) => ({ ...r, from: event.target.value }))} />
        <TextField
          label="To"
          type="date"
          value={range.to}
          min={range.from}
          onChange={(event) => setRange((r) => ({ ...r, to: event.target.value }))}
          error={range.from && range.to && !validRange ? 'Choose a day after the start.' : undefined}
        />
      </div>

      {page.status === 'loading' && <LoadingView label="Checking rooms…" />}
      {page.status === 'error' && <ErrorView message={errorMessage(page.error)} actionLabel="Try again" onAction={page.reload} />}
      {page.status === 'success' &&
        (rooms.length === 0 ? (
          <p className={styles.empty}>No rooms yet.{can(staff, 'manageHotel') ? ' Add your first room above.' : ''}</p>
        ) : (
          <>
            <p className={styles.secondary}>
              {rooms.length} rooms · {free} free for the whole period · {formatDate(range.from)} to {formatDate(range.to)}
            </p>
            <ul className={styles.list}>
              {rooms.map((room) => (
                <li key={room.id ?? room.number}>
                  <RoomRow room={room} />
                </li>
              ))}
            </ul>
          </>
        ))}
    </AdminScreen>
  )
}

function RoomRow({ room }) {
  const bookings = roomBookings(room).sort((a, b) => stayDate(a.checkIn).localeCompare(stayDate(b.checkIn)))
  return (
    <div className={`${styles.row} ${styles.rowTop}`}>
      <span className={`${styles.avatar} ${bookings.length ? '' : styles.avatarAccent}`} aria-hidden="true">
        <DoorOpen size={20} />
      </span>
      <span className={styles.text}>
        <span className={styles.primary}>Room {room.number}</span>
        {roomTypeName(room) && <span className={styles.secondary}>{roomTypeName(room)}</span>}
        {bookings.length > 0 && (
          <ul className={styles.bookedList}>
            {bookings.map((booking, index) => (
              <li key={booking.id ?? index}>
                {booking.id ? (
                  <Link to={`/admin/bookings/${booking.id}`}>{shortStayLabel(booking)}</Link>
                ) : (
                  shortStayLabel(booking)
                )}
                {personName(booking.guest) && ` · ${personName(booking.guest)}`}
              </li>
            ))}
          </ul>
        )}
      </span>
      <span className={`${styles.pill} ${bookings.length ? styles.info : styles.good}`}>{bookings.length ? 'Booked' : 'Free'}</span>
    </div>
  )
}

/** POST /admin/rooms { number, roomTypeId } (managers). */
function AddRoomCard({ onDone }) {
  const types = useAsync((signal) => listRoomTypes({ signal }).then(asList), 'room-types')
  const [form, setForm] = useState({ number: '', roomTypeId: '' })
  const [errors, setErrors] = useState({})
  const [submit, setSubmit] = useState({ status: 'idle' })
  const saving = submit.status === 'saving'

  const save = async (event) => {
    event.preventDefault()
    const problems = {}
    if (!form.number.trim()) problems.number = 'Enter the room number.'
    if (!form.roomTypeId) problems.roomTypeId = 'Choose a room type.'
    setErrors(problems)
    if (Object.keys(problems).length) return
    setSubmit({ status: 'saving' })
    try {
      await createRoom({ number: form.number.trim(), roomTypeId: form.roomTypeId })
      onDone(true)
    } catch (error) {
      setErrors(fieldErrors(error))
      setSubmit({
        status: 'error',
        message: error.code === ERROR_CODES.ALREADY_EXISTS ? `Room ${form.number.trim()} already exists.` : errorMessage(error),
      })
    }
  }

  const typeOptions = [
    { value: '', label: 'Choose a room type' },
    ...(types.data ?? []).map((type) => ({ value: type.id, label: type.name })),
  ]

  return (
    <Card aria-labelledby="add-room-heading">
      <h2 id="add-room-heading" className={styles.cardTitle}>
        Add a room
      </h2>
      {types.status === 'error' && <Alert tone="error" title={errorMessage(types.error)} />}
      {types.status === 'success' && types.data.length === 0 ? (
        <p className={styles.secondary}>This hotel has no room types yet. A room type (with its price) must exist before rooms can be added.</p>
      ) : (
        <form className={styles.form} onSubmit={save} noValidate>
          {submit.status === 'error' && <Alert tone="error" title={submit.message} />}
          <TextField label="Room number" placeholder="e.g. 204" value={form.number} onChange={(event) => setForm((f) => ({ ...f, number: event.target.value }))} error={errors.number} disabled={saving} />
          <SelectField
            label="Room type"
            options={typeOptions}
            value={form.roomTypeId}
            onChange={(event) => setForm((f) => ({ ...f, roomTypeId: event.target.value }))}
            error={errors.roomTypeId}
            disabled={saving || types.status !== 'success'}
          />
          <div className={styles.formActions}>
            <Button type="submit" loading={saving} loadingLabel="Adding…">
              Add room
            </Button>
            <Button variant="ghost" onClick={() => onDone(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
