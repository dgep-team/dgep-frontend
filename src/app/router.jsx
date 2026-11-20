import { createBrowserRouter, Navigate } from 'react-router'
import { LogoutRoute } from '../components/auth/LogoutRoute.jsx'
import { RequireAuth } from '../components/auth/RequireAuth.jsx'
import { AppShell } from '../components/layout/AppShell.jsx'
import { LoginPage } from '../features/auth/LoginPage.jsx'
import { RegisterPage } from '../features/auth/RegisterPage.jsx'
import { BookingDetailsPage } from '../features/booking/BookingDetailsPage.jsx'
import { BookingPage } from '../features/bookings/BookingPage.jsx'
import { BookingsPage } from '../features/bookings/BookingsPage.jsx'
import { CheckInPage } from '../features/checkin/CheckInPage.jsx'
import { HomePage } from '../features/home/HomePage.jsx'
import { PaymentCallbackPage } from '../features/payment/PaymentCallbackPage.jsx'
import { PaymentPage } from '../features/payment/PaymentPage.jsx'
import { PaymentSuccessPage } from '../features/payment/PaymentSuccessPage.jsx'
import { ProfilePage } from '../features/profile/ProfilePage.jsx'
import { RequestPage } from '../features/requests/RequestPage.jsx'
import { RequestsPage } from '../features/requests/RequestsPage.jsx'
import { SavedPage } from '../features/saved/SavedPage.jsx'
import { SearchPage } from '../features/search/SearchPage.jsx'
import { NotFoundPage } from '../pages/PlaceholderPage.jsx'

// Screen -> endpoints (DGEP API v1):
//   Login / Sign up      POST /auth/login, POST /auth/register
//   Home                 GET /hotels (+ GET /me, GET /bookings when logged in)
//   Search               GET /hotels, GET /hotels/:id?checkIn&checkOut&guests
//   Booking details      GET /hotels/:id, POST /bookings
//   Payment              GET /bookings/:id, POST /bookings/:id/payments
//   Payment callback     GET /payments/verify/:reference
//   Payment success      GET /bookings/:id
//   Booking (success)    GET /bookings/:id, GET /bookings/:id/arrival, PATCH /bookings/:id/cancel
//   Pre-check-in         GET + POST /bookings/:id/check-in
//   Service requests     GET /concierge/categories, GET + POST /bookings/:id/requests,
//                        GET /requests/:id, PATCH /requests/:id/cancel
//   Profile              GET + PATCH /me, POST /auth/password
//   Saved                none yet: kept on the device (services/savedService.js)
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'logout', element: <LogoutRoute /> },

      // Booking flow: search -> details -> payment -> callback -> booking -> check-in.
      // Search and details are open to everyone: guests can book without an account.
      { path: 'search', element: <SearchPage /> },
      { path: 'booking', element: <BookingDetailsPage /> },

      {
        element: <RequireAuth />,
        children: [
          { path: 'bookings', element: <BookingsPage /> },
          { path: 'bookings/:bookingId', element: <BookingPage /> },
          { path: 'bookings/:bookingId/pay', element: <PaymentPage /> },
          // Where a verified payment lands: confirmation + booking details.
          { path: 'bookings/:bookingId/confirmed', element: <PaymentSuccessPage /> },
          { path: 'bookings/:bookingId/check-in', element: <CheckInPage /> },
          { path: 'bookings/:bookingId/requests', element: <RequestsPage /> },
          { path: 'requests/:requestId', element: <RequestPage /> },
          // Paystack's callback URL. The backend must send guests here with ?reference=...
          { path: 'payments/callback', element: <PaymentCallbackPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },

      // Open to everyone: saves are kept per device until the guest logs in.
      { path: 'saved', element: <SavedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
