import { RouterProvider } from 'react-router'
import { AuthProvider } from '../state/AuthProvider.jsx'
import { BookingFlowProvider } from '../state/BookingFlowProvider.jsx'
import { router } from './router.jsx'

export function App() {
  return (
    <AuthProvider>
      <BookingFlowProvider>
        <RouterProvider router={router} />
      </BookingFlowProvider>
    </AuthProvider>
  )
}
