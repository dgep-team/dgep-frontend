import { createBrowserRouter, Navigate } from 'react-router'
import { LogoutRoute } from '../components/auth/LogoutRoute.jsx'
import { RequireAuth } from '../components/auth/RequireAuth.jsx'
import { RequireStaff } from '../components/auth/RequireStaff.jsx'
import { AppShell } from '../components/layout/AppShell.jsx'
import { StaffLoginPage } from '../features/admin/auth/StaffLoginPage.jsx'
import { AdminBookingPage } from '../features/admin/bookings/AdminBookingPage.jsx'
import { AdminBookingsPage } from '../features/admin/bookings/AdminBookingsPage.jsx'
import { AdminShell } from '../features/admin/components/AdminShell.jsx'
import { DashboardPage } from '../features/admin/dashboard/DashboardPage.jsx'
import { AdminGuestsPage } from '../features/admin/guests/AdminGuestsPage.jsx'
import { AdminMorePage } from '../features/admin/more/AdminMorePage.jsx'
import { LoginPage } from '../features/auth/LoginPage.jsx'
import { RegisterPage } from '../features/auth/RegisterPage.jsx'
import { BookingDetailsPage } from '../features/booking/BookingDetailsPage.jsx'
import { BookingPage } from '../features/bookings/BookingPage.jsx'
import { BookingsPage } from '../features/bookings/BookingsPage.jsx'
import { CheckInPage } from '../features/checkin/CheckInPage.jsx'
import { IdUploadPage } from '../features/checkin/IdUploadPage.jsx'
import { HomePage } from '../features/home/HomePage.jsx'
import { DigitalKeyPage } from '../features/key/DigitalKeyPage.jsx'
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
//   Digital check-in     GET + POST /bookings/:id/check-in (step 1: details + QR, step 2: ID upload)
//   ID upload            MOCK: no endpoint yet (services/mock/idDocumentService.js)
//   Digital key          GET /bookings/:id, GET /bookings/:id/arrival; unlocking is MOCK
//   Service requests     GET /concierge/categories, GET + POST /bookings/:id/requests,
//                        GET /requests/:id, PATCH /requests/:id/cancel
//   Profile              GET + PATCH /me, POST /auth/password
//   Saved                none yet: kept on the device (services/savedService.js)
//
// Hotel staff (/admin, staff token, own shell):
//   Staff login          POST /admin/auth/login
//   Dashboard            GET /admin/overview, GET /admin/bookings (7-day chart counted on the device)
//   All bookings         GET /admin/bookings; one booking GET /admin/bookings/:id, POST .../check-in
//   Guests               GET /admin/guests
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
          { path: 'bookings/:bookingId/check-in/id', element: <IdUploadPage /> },
          { path: 'bookings/:bookingId/key', element: <DigitalKeyPage /> },
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

  // Hotel staff: a separate login and frame from the guest app.
  { path: 'admin/login', element: <StaffLoginPage /> },
  {
    path: 'admin',
    element: <RequireStaff />,
    children: [
      {
        element: <AdminShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'bookings', element: <AdminBookingsPage /> },
          { path: 'bookings/:bookingId', element: <AdminBookingPage /> },
          { path: 'guests', element: <AdminGuestsPage /> },
          { path: 'more', element: <AdminMorePage /> },
        ],
      },
    ],
  },
])
