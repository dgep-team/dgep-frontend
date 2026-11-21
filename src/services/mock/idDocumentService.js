// MOCK: the DGEP API has no ID-upload endpoint yet. Until it does, the guest's
// choice is kept on this device only, and the file itself is never stored or
// sent anywhere: only its name, type and the ID type are remembered, so the
// check-in screens can show that an ID was added.
// Replace these two functions with real API calls when the endpoint exists.

const KEY = (bookingId) => `stayease.mock.idDocument.${bookingId}`
const MAX_BYTES = 5 * 1024 * 1024

export const ID_TYPES = [
  { value: '', label: 'Choose ID type' },
  { value: 'PASSPORT', label: 'International passport' },
  { value: 'NIN', label: 'National ID (NIN slip or card)' },
  { value: 'DRIVERS_LICENCE', label: 'Driver’s licence' },
  { value: 'VOTERS_CARD', label: 'Voter’s card' },
]

export const ACCEPTED_ID_FILES = 'image/jpeg,image/png,image/webp,image/heic,application/pdf'

/** Returns an error message for a file the guest picked, or null when it is fine. */
export function checkIdFile(file) {
  if (!file) return 'Add a photo or scan of your ID.'
  if (!ACCEPTED_ID_FILES.split(',').includes(file.type)) return 'Use a photo (JPG, PNG, WEBP, HEIC) or a PDF.'
  if (file.size > MAX_BYTES) return 'That file is over 5 MB. Try a smaller photo.'
  return null
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Pretends to upload: waits briefly, then remembers the file's details on this device. */
export async function saveIdDocument(bookingId, { file, idType }) {
  await wait(900)
  const record = { idType, fileName: file.name, fileType: file.type, savedAt: new Date().toISOString() }
  try {
    window.localStorage.setItem(KEY(bookingId), JSON.stringify(record))
  } catch {
    // Storage blocked: the check-in still goes ahead.
  }
  return record
}

export function getIdDocument(bookingId) {
  try {
    const raw = window.localStorage.getItem(KEY(bookingId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const idTypeLabel = (value) => ID_TYPES.find((type) => type.value === value)?.label ?? 'Government ID'
