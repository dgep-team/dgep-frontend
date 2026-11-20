import { RouterProvider } from 'react-router'
import { AuthProvider } from '../state/AuthProvider.jsx'
import { BookingFlowProvider } from '../state/BookingFlowProvider.jsx'
import { SavedProvider } from '../state/SavedProvider.jsx'
import { router } from './router.jsx'

export function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <BookingFlowProvider>
          <RouterProvider router={router} />
        </BookingFlowProvider>
      </SavedProvider>
    </AuthProvider>
  )
}
