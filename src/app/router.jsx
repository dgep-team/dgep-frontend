import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '../components/layout/AppShell.jsx'
import { BookingDetailsPage } from '../features/booking/BookingDetailsPage.jsx'
import { BookingsPage } from '../features/bookings/BookingsPage.jsx'
import { CheckInPage } from '../features/checkin/CheckInPage.jsx'
import { HomePage } from '../features/home/HomePage.jsx'
import { PaymentPage } from '../features/payment/PaymentPage.jsx'
import { SearchPage } from '../features/search/SearchPage.jsx'
import { NotFoundPage, PlaceholderPage } from '../pages/PlaceholderPage.jsx'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },

      // Booking flow: search -> details -> payment -> check-in
      { path: 'search', element: <SearchPage /> },
      { path: 'booking', element: <BookingDetailsPage /> },
      { path: 'booking/payment', element: <PaymentPage /> },
      { path: 'bookings', element: <BookingsPage /> },
      { path: 'bookings/:bookingId/check-in', element: <CheckInPage /> },

      { path: 'saved', element: <PlaceholderPage title="Saved" /> },
      { path: 'profile', element: <PlaceholderPage title="Profile" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
