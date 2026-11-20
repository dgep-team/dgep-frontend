// The API sends every amount as whole kobo (Paystack's unit): 4500000 = ₦45,000.
// Convert only for display; never do arithmetic on the naira values.

const whole = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })
const exact = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 })

/** 4500000 -> "₦45,000"; 4500050 -> "₦45,000.50". null/undefined -> "—". */
export function formatKobo(kobo) {
  if (kobo === null || kobo === undefined || Number.isNaN(Number(kobo))) return '—'
  const value = Number(kobo)
  return value % 100 === 0 ? whole.format(value / 100) : exact.format(value / 100)
}
