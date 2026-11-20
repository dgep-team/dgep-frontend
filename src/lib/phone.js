/** "+234 1 277 2700" -> "tel:+23412772700" (digits and a leading + only); null without a number. */
export function telHref(phone) {
  const digits = String(phone ?? '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return digits ? `tel:${digits}` : null
}
