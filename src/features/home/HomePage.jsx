import { ArrowRight, CircleUserRound, CreditCard, ReceiptText, Search, Smartphone } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import heroImage from '../../assets/images/lounge.jpg'
import { Alert } from '../../components/feedback/Alert.jsx'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Brand } from '../../components/layout/Brand.jsx'
import { SaveButton } from '../../components/saved/SaveButton.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { CITY_IMAGES, hotelImage, roomImage } from '../../data/images.js'
import { useAsync } from '../../hooks/useAsync.js'
import { formatDateRange, pluralize } from '../../lib/dates.js'
import { formatKobo } from '../../lib/money.js'
import { buildCatalog, featuredByTier, summarizeCities } from '../../lib/roomSearch.js'
import { errorMessage } from '../../services/api/errors.js'
import { listBookings } from '../../services/bookingService.js'
import { listHotels, searchStays } from '../../services/hotelService.js'
import { useAuth } from '../../state/authContext.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'
import { describeBooking, upcomingBooking } from '../bookings/bookingStatus.js'
import { useSelectRoom } from '../search/useSelectRoom.js'
import styles from './HomePage.module.css'

const QUICK_SEARCHES = ['Lagos', 'Abuja', 'King', 'Budget']

const PROMISES = [
  { icon: ReceiptText, title: 'All-in prices', text: 'Taxes included from the first screen. No surprises at checkout.' },
  { icon: CreditCard, title: 'Pay your way', text: 'Card, bank transfer or USSD through Paystack, with clear help if a payment fails.' },
  { icon: Smartphone, title: 'Check in early', text: 'Share your arrival time before you land and skip the front-desk queue.' },
]

const searchUrl = (query) => `/search?q=${encodeURIComponent(query)}`

/** Home: GET /hotels and room availability; GET /bookings for the next stay when logged in. */
export function HomePage() {
  const navigate = useNavigate()
  const selectRoom = useSelectRoom()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const { guest, isLoggedIn } = useAuth()
  const { draft } = useBookingFlow()
  const { checkIn, checkOut, guests } = draft

  const hotelsRequest = useAsync((signal) => listHotels({ signal }), 'hotels')
  const staysRequest = useAsync((signal) => searchStays({ checkIn, checkOut, guests, signal }), `${checkIn}|${checkOut}|${guests}`)
  const bookingsRequest = useAsync((signal) => listBookings({ signal }), isLoggedIn ? `bookings|${guest?.id}` : null)

  const catalog = useMemo(
    () => (staysRequest.status === 'success' ? buildCatalog(staysRequest.data) : []),
    [staysRequest.status, staysRequest.data],
  )
  const nextStay = bookingsRequest.status === 'success' ? upcomingBooking(bookingsRequest.data) : null

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(query.trim() ? searchUrl(query.trim()) : '/search')
  }

  return (
    <div className={styles.page}>
      {/* Phones have no top nav, so Home carries the brand itself. */}
      <header className={styles.mobileBar}>
        <Brand />
        <Link to="/profile" className={styles.profile} aria-label="Profile">
          <CircleUserRound size={28} aria-hidden="true" />
        </Link>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <img src={heroImage} alt="" className={styles.heroImage} />
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{guest?.firstName ? `Welcome back, ${guest.firstName}` : 'Lagos · Abuja'}</p>
            <h1 id="home-title" className={styles.heroTitle}>
              Your stay, sorted from the first tap.
            </h1>
            <p className={styles.heroText}>Find the right room, see the full price upfront and check in from your phone.</p>
            <div className={styles.heroActions}>
              <Link to="/search" className={styles.heroPrimary}>
                Find a room <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to={isLoggedIn ? '/bookings' : '/login'} className={styles.heroSecondary}>
                {isLoggedIn ? 'My bookings' : 'Log in'}
              </Link>
            </div>
          </div>
        </section>

        <form role="search" className={styles.searchCard} onSubmit={submitSearch}>
          <label htmlFor={searchId} className={styles.searchLabel}>
            Where to, or what kind of room?
          </label>
          <div className={styles.searchRow}>
            <div className={styles.searchField}>
              <Search size={20} aria-hidden="true" />
              <input
                id={searchId}
                type="search"
                placeholder="e.g. Lagos, deluxe, king bed"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                enterKeyHint="search"
                autoComplete="off"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
          <ul className={styles.quickList} aria-label="Popular searches">
            {QUICK_SEARCHES.map((term) => (
              <li key={term}>
                <Link to={searchUrl(term)} className={styles.quickChip}>
                  {term}
                </Link>
              </li>
            ))}
          </ul>
        </form>

        {nextStay && <NextStayCard booking={nextStay} />}

        {hotelsRequest.status === 'error' && (
          <ErrorView message={errorMessage(hotelsRequest.error)} actionLabel="Try again" onAction={hotelsRequest.reload} />
        )}
        {hotelsRequest.status === 'success' && hotelsRequest.data.length > 0 && (
          <section className={styles.section} aria-labelledby="cities-heading">
            <h2 id="cities-heading" className={styles.sectionTitle}>
              Explore by city
            </h2>
            <ul className={styles.cities}>
              {summarizeCities(hotelsRequest.data).map(({ city, hotelCount, fromRate }) => (
                <li key={city}>
                  <Link to={searchUrl(city)} className={styles.cityCard}>
                    <img
                      src={CITY_IMAGES[city] ?? hotelImage(hotelsRequest.data.find((hotel) => hotel.city === city))}
                      alt=""
                      className={styles.cityImage}
                      loading="lazy"
                    />
                    <span className={styles.cityText}>
                      <span className={styles.cityName}>{city}</span>
                      <span className={styles.cityMeta}>
                        {pluralize(hotelCount, 'hotel')}
                        {fromRate !== null && ` · from ${formatKobo(fromRate)}`}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {staysRequest.status === 'loading' && <LoadingView label="Loading stays…" />}
        {staysRequest.status === 'success' && catalog.length > 0 && (
          <section className={styles.section} aria-labelledby="featured-heading">
            <div className={styles.sectionHead}>
              <h2 id="featured-heading" className={styles.sectionTitle}>
                From easy value to pure luxury
              </h2>
              <Link to="/search" className={styles.seeAll}>
                See all rooms
              </Link>
            </div>
            <ul className={styles.featured}>
              {featuredByTier(catalog).map((entry) => (
                <li key={entry.roomType.id}>
                  <article className={styles.featureCard}>
                    <div className={styles.featureMedia}>
                      <img src={roomImage(entry.roomType)} alt={`${entry.roomType.name} at ${entry.hotel.name}`} loading="lazy" />
                      <span className={styles.featureTier}>{entry.tier.label}</span>
                      <SaveButton kind="room" hotel={entry.hotel} roomType={entry.roomType} className={styles.featureSave} />
                    </div>
                    <div className={styles.featureBody}>
                      <h3 className={styles.featureName}>{entry.roomType.name}</h3>
                      <p className={styles.featureMeta}>
                        {entry.hotel.name} · {entry.hotel.city}
                      </p>
                      <div className={styles.featureFoot}>
                        <p>
                          <strong>{formatKobo(entry.roomType.pricePerNight)}</strong>
                          <span className={styles.perNight}> / night</span>
                        </p>
                        <button
                          type="button"
                          className={styles.featureAction}
                          onClick={() => selectRoom(entry)}
                          aria-label={`Book ${entry.roomType.name} at ${entry.hotel.name}`}
                        >
                          Book <ArrowRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.promises} aria-labelledby="promises-heading">
          <h2 id="promises-heading" className="visually-hidden">
            Why StayEase
          </h2>
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <div key={title} className={styles.promise}>
              <span className={styles.promiseIcon} aria-hidden="true">
                <Icon size={22} />
              </span>
              <div>
                <h3 className={styles.promiseTitle}>{title}</h3>
                <p className={styles.promiseText}>{text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

function NextStayCard({ booking }) {
  const { hotel, roomType } = booking.room ?? {}
  const status = describeBooking(booking)
  return (
    <Alert
      tone="info"
      title={`Your next stay: ${hotel?.name ?? 'your hotel'}`}
      actions={
        <Button variant="secondary" to={`/bookings/${booking.id}`}>
          View booking
        </Button>
      }
    >
      {roomType?.name} · {formatDateRange(booking.checkIn, booking.checkOut)} · {status.label}
    </Alert>
  )
}
