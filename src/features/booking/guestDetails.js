const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const EMPTY_GUEST = { firstName: '', lastName: '', email: '', phone: '' }

/** Errors keyed like the API's VALIDATION_ERROR details ("guest.email"). */
export function validateGuest(guest) {
  const errors = {}
  if (!guest.firstName.trim()) errors['guest.firstName'] = 'Enter your first name.'
  if (!guest.lastName.trim()) errors['guest.lastName'] = 'Enter your last name.'
  if (!guest.email.trim()) errors['guest.email'] = 'Enter your email address.'
  else if (!EMAIL_PATTERN.test(guest.email.trim())) errors['guest.email'] = 'Check your email address.'
  return errors
}
