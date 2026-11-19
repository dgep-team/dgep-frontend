const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Formats a whole-naira amount, e.g. 260000 -> "₦260,000". */
export function formatNaira(amount) {
  return nairaFormatter.format(amount)
}
