// MOCK: the DGEP API has no digital-key endpoint yet. Unlocking only waits a
// moment and reports success, so the Digital Key screen can be tried end to
// end. The key is "active" once the guest is checked in at the hotel (status
// CHECKED_IN), which is when a room number is assigned; before that a real
// API would answer KEY_NOT_ACTIVE.
// Replace unlockDoor with the real call when the endpoint exists.

import { BOOKING_STATUS } from '../bookingService.js'

export const isKeyActive = (booking) => booking.status === BOOKING_STATUS.checkedIn

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function unlockDoor() {
  await wait(1200)
  return { unlocked: true, relockAfterSeconds: 5 }
}
