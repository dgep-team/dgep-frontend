import { CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react'

// Payment options offered at checkout (BR-10). Adding a method means adding
// an entry here and, if it needs input, a panel in PaymentPage.
export const PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Card Payment',
    description: 'Visa, Mastercard, Verve',
    icon: CreditCard,
    badge: 'cards',
  },
  {
    id: 'wallet',
    label: 'Wallet Payment',
    description: 'Pay with Wallet',
    icon: Wallet,
    badge: 'PalmPay',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    description: 'Transfer directly',
    icon: Landmark,
  },
  {
    id: 'ussd',
    label: 'USSD',
    description: 'Dial *737#',
    icon: Smartphone,
  },
]
