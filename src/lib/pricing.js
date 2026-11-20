// Price maths in kobo, mirroring the DGEP API (checked against staging):
//   add-on amount = price × quantity, where quantity is
//     STAY -> 1, NIGHT -> nights, GUEST_NIGHT -> guests × nights
//   subtotal = room total + add-ons
//   each tax = round(subtotal × percent / 100); total = subtotal + taxes
// The server's figure is always the one charged: these only preview it
// (before booking) or itemise it (on the receipt).

export function addOnQuantity(per, { nights, guests }) {
  if (per === 'NIGHT') return nights
  if (per === 'GUEST_NIGHT') return guests * nights
  return 1
}

const taxLines = (subtotal, taxes = []) =>
  taxes.map((tax) => ({ name: tax.name, percent: tax.percent, amount: Math.round((subtotal * tax.percent) / 100) }))

/**
 * Adds the chosen extras to the API's room-only `Price`, so the guest sees
 * the full total before paying. Returns a `Price` with `addOns`, `subtotal`,
 * `taxes` and `total` recomputed. `selected` is a list of add-on codes.
 */
export function priceWithAddOns(price, catalog = [], selected = [], { guests }) {
  if (!price) return price
  const chosen = catalog.filter((addOn) => selected.includes(addOn.code))
  if (chosen.length === 0) return price

  const addOns = chosen.map((addOn) => {
    const quantity = addOnQuantity(addOn.per, { nights: price.nights, guests })
    return { code: addOn.code, name: addOn.name, per: addOn.per, price: addOn.price, quantity, amount: addOn.price * quantity }
  })
  const subtotal = price.roomTotal + addOns.reduce((sum, addOn) => sum + addOn.amount, 0)
  const taxes = taxLines(subtotal, price.taxes)
  return { ...price, addOns, subtotal, taxes, total: subtotal + taxes.reduce((sum, tax) => sum + tax.amount, 0) }
}

/**
 * Works out a paid booking's breakdown from what the API stores: the total,
 * the add-on amounts and the hotel's tax rates. Returns
 * { roomTotal, addOns, subtotal, taxes, total }, or null when it can't be
 * trusted, so a receipt never shows a split that differs from what was charged:
 *   - the lines don't add up to exactly `total`, or
 *   - `expectedRoomTotal` (the room's price for the booked dates) is given and
 *     differs, meaning the room rate or a tax rate changed since booking.
 * With one tax rate almost any total "adds up", so pass `expectedRoomTotal`.
 */
export function breakdownFromTotal({ total, addOns = [], taxes = [], expectedRoomTotal }) {
  const rate = taxes.reduce((sum, tax) => sum + tax.percent, 0)
  const subtotal = Math.round(total / (1 + rate / 100))
  const extras = addOns.reduce((sum, addOn) => sum + (addOn.amount ?? 0), 0)
  const roomTotal = subtotal - extras
  const lines = taxLines(subtotal, taxes)
  const sum = subtotal + lines.reduce((acc, tax) => acc + tax.amount, 0)
  if (roomTotal <= 0 || sum !== total) return null
  if (expectedRoomTotal !== undefined && expectedRoomTotal !== roomTotal) return null
  return { roomTotal, addOns, subtotal, taxes: lines, total }
}
