import { RouterProvider } from 'react-router'
import { BookingFlowProvider } from '../state/BookingFlowProvider.jsx'
import { router } from './router.jsx'

export function App() {
  return (
    <BookingFlowProvider>
      <RouterProvider router={router} />
    </BookingFlowProvider>
  )
}
