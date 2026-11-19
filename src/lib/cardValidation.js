// Client-side checks only, to catch typos before the request. The payment
// provider remains the authority on whether a card is valid.

export const digitsOnly = (value) => value.replace(/\D/g, '')

export function detectCardBrand(number) {
  const digits = digitsOnly(number)
  if (/^(5060|5061|5078|5079|6500)/.test(digits)) return 'verve'
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return 'mastercard'
  return null
}

export function formatCardNumber(value) {
  return digitsOnly(value)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function passesLuhn(number) {
  const digits = digitsOnly(number)
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
  }
  return digits.length > 0 && sum % 10 === 0
}

/** Returns a map of field -> message. An empty object means the card looks valid. */
export function validateCard({ number, expiry, cvv }, now = new Date()) {
  const errors = {}
  const digits = digitsOnly(number)

  if (!digits) errors.number = 'Enter your card number.'
  else if (digits.length < 13 || !passesLuhn(digits)) errors.number = 'Check your card number.'

  const match = /^(\d{2})\/(\d{2})$/.exec(expiry)
  if (!expiry) errors.expiry = 'Enter the expiry date.'
  else if (!match || Number(match[1]) < 1 || Number(match[1]) > 12) errors.expiry = 'Use MM/YY.'
  else {
    // A card is valid through the last day of its expiry month.
    const endOfMonth = new Date(2000 + Number(match[2]), Number(match[1]), 1)
    if (endOfMonth <= now) errors.expiry = 'This card has expired.'
  }

  if (!cvv) errors.cvv = 'Enter the CVV.'
  else if (!/^\d{3,4}$/.test(cvv)) errors.cvv = 'CVV is 3 or 4 digits.'

  return errors
}
