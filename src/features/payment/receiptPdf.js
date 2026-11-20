import { createPdf } from '../../lib/pdf.js'
import { breakdownFromTotal } from '../../lib/pricing.js'

// Brand palette (tokens.css), for the PDF.
const BLUE = '#1a47b8'
const NAVY = '#0f2a66'
const IVORY = '#fbf8ef'
const TEXT = '#141b2d'
const MUTED = '#545a6a'
const RULE = '#e6e0cf'

const naira = new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const money = (kobo) => `NGN ${naira.format(kobo / 100)}`

/**
 * Builds the payment receipt PDF for a paid booking.
 *   booking  GET /bookings/:id (with room.hotel, addOns, payments, totalAmount)
 *   taxes    the hotel's tax rates [{ name, percent }] (GET /hotels/:id), to itemise the total
 *   roomTotal the room's price for the booked dates (same call); the split is only shown if it matches
 *   guest    { firstName, lastName, email } for "Billed to"
 *   stay     display strings: { checkIn, checkOut, nights, guests, paidAt }
 */
export function buildReceiptPdf({ booking, taxes, roomTotal, guest, stay, issuedAt = new Date() }) {
  const doc = createPdf()
  const left = 48
  const right = doc.width - 48
  const { hotel, roomType } = booking.room ?? {}
  const payment = booking.payments?.findLast((attempt) => attempt.status === 'SUCCESS')
  const total = payment?.amount ?? booking.totalAmount

  // Header band
  doc.rect(0, 0, doc.width, 96, BLUE)
  doc.text('StayEase', left, 52, { size: 24, bold: true, color: '#ffffff' })
  doc.text('Book - Stay - Enjoy', left, 70, { size: 9, color: '#e3ebfc' })
  doc.text('PAYMENT RECEIPT', right, 50, { size: 11, bold: true, color: '#ffffff', align: 'right' })
  doc.text(`Issued ${stay.issued ?? issuedAt.toDateString()}`, right, 66, { size: 9, color: '#e3ebfc', align: 'right' })

  // Status + reference
  let top = 132
  doc.text('Payment successful', left, top, { size: 18, bold: true, color: TEXT })
  doc.text(`Your stay at ${hotel?.name ?? 'the hotel'} is confirmed.`, left, top + 18, { size: 10, color: MUTED })

  top += 40
  doc.rect(left, top, right - left, 46, IVORY)
  doc.text('BOOKING REFERENCE', left + 14, top + 18, { size: 8, bold: true, color: MUTED })
  doc.text(booking.id, left + 14, top + 34, { size: 11, bold: true, color: BLUE })
  doc.text('Show this at the front desk', right - 14, top + 28, { size: 9, color: MUTED, align: 'right' })

  // Billed to / Payment
  top += 76
  const column = left + (right - left) / 2
  doc.text('BILLED TO', left, top, { size: 8, bold: true, color: MUTED })
  doc.text('PAYMENT', column, top, { size: 8, bold: true, color: MUTED })
  const name = [guest?.firstName, guest?.lastName].filter(Boolean).join(' ')
  const billed = [name, guest?.email].filter(Boolean)
  const paid = [stay.paidAt && `Paid ${stay.paidAt}`, payment?.channel && `Method: ${payment.channel}`, payment?.reference && `Ref: ${payment.reference}`].filter(Boolean)
  billed.forEach((line, i) => doc.text(line, left, top + 16 + i * 14, { size: 10, color: TEXT }))
  paid.forEach((line, i) => doc.text(line, column, top + 16 + i * 14, { size: 10, color: TEXT }))
  top += 16 + Math.max(billed.length, paid.length, 1) * 14 + 18

  // Stay details
  doc.text('STAY', left, top, { size: 8, bold: true, color: MUTED })
  top += 8
  const stayRows = [
    ['Hotel', hotel?.name],
    ['Address', [hotel?.address, hotel?.city].filter(Boolean).join(', ')],
    ['Phone', hotel?.phone],
    ['Room', roomType?.name],
    ['Check-in', stay.checkIn],
    ['Check-out', stay.checkOut],
    ['Length of stay', stay.nights],
    ['Guests', stay.guests],
  ].filter(([, value]) => value)
  for (const [label, value] of stayRows) {
    top += 18
    doc.text(label, left, top, { size: 10, color: MUTED })
    doc.text(value, left + 120, top, { size: 10, color: TEXT })
  }

  // Charges
  top += 34
  doc.text('CHARGES', left, top, { size: 8, bold: true, color: MUTED })
  doc.text('AMOUNT', right, top, { size: 8, bold: true, color: MUTED, align: 'right' })
  top += 8
  doc.line(left, top, right, top, { color: RULE })

  const addOns = booking.addOns ?? []
  const breakdown = taxes && roomTotal !== undefined ? breakdownFromTotal({ total, addOns, taxes, expectedRoomTotal: roomTotal }) : null
  const rows = breakdown
    ? [
        [`Room - ${roomType?.name ?? 'stay'} (${stay.nights})`, breakdown.roomTotal],
        ...addOns.map((addOn) => [addOnLabel(addOn), addOn.amount]),
        ['Subtotal', breakdown.subtotal, { strong: true }],
        ...breakdown.taxes.map((tax) => [`${tax.name} (${tax.percent}%)`, tax.amount]),
      ]
    : // Rates changed since booking: list what is known, never invent a split.
      [
        ...addOns.map((addOn) => [addOnLabel(addOn), addOn.amount]),
        [addOns.length ? 'Room, taxes and charges' : 'Room, including taxes and charges', total - addOns.reduce((sum, addOn) => sum + addOn.amount, 0)],
      ]

  for (const [label, amount, options = {}] of rows) {
    top += 20
    doc.text(label, left, top, { size: 10, bold: options.strong, color: TEXT })
    doc.text(money(amount), right, top, { size: 10, bold: options.strong, color: TEXT, align: 'right' })
  }

  top += 14
  doc.rect(left, top, right - left, 40, BLUE)
  doc.text('Total paid', left + 14, top + 25, { size: 13, bold: true, color: '#ffffff' })
  doc.text(money(total), right - 14, top + 25, { size: 13, bold: true, color: '#ffffff', align: 'right' })

  // Footer
  doc.line(left, doc.height - 86, right, doc.height - 86, { color: RULE })
  doc.text('Thank you for booking with StayEase.', left, doc.height - 66, { size: 10, bold: true, color: NAVY })
  doc.text('All amounts in Nigerian naira (NGN), including VAT and service charges. No further charges at the hotel.', left, doc.height - 50, { size: 8, color: MUTED })
  doc.text('Generated from your booking record. For changes, contact the hotel with your booking reference.', left, doc.height - 38, { size: 8, color: MUTED })

  return doc.toBlob({ title: `StayEase receipt ${booking.id}` })
}

function addOnLabel(addOn) {
  const name = addOn.name ?? addOn.code
  return addOn.quantity > 1 ? `${name} (${money(addOn.price)} x ${addOn.quantity})` : name
}
