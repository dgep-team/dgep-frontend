import { Alert } from '../../../components/feedback/Alert.jsx'
import { formatNaira } from '../../../lib/money.js'

const COPY = {
  wallet: {
    title: 'Pay with PalmPay',
    body: (amount) => `You’ll be sent to PalmPay to approve ${amount}. Come back here once it’s done.`,
  },
  bank_transfer: {
    title: 'Pay by bank transfer',
    body: (amount) =>
      `After you tap Pay, we’ll show a one-time account number. Transfer exactly ${amount} and your booking is confirmed as soon as it arrives.`,
  },
  ussd: {
    title: 'Pay with USSD',
    body: (amount) =>
      `After you tap Pay, dial the code shown from the phone number linked to your bank account and approve ${amount}.`,
  },
}

export function MethodInstructions({ method, total }) {
  const copy = COPY[method]
  if (!copy) return null
  return (
    <Alert tone="info" title={copy.title}>
      {copy.body(formatNaira(total))}
    </Alert>
  )
}
