import { ArrowRight, CircleUserRound, CreditCard, ReceiptText, Search, Smartphone } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import heroImage from '../../assets/images/lounge.jpg'
import lagosImage from '../../assets/images/pool.jpg'
import abujaImage from '../../assets/images/reception.jpg'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Brand } from '../../components/layout/Brand.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { pluralize } from '../../lib/dates.js'
import { formatNaira } from '../../lib/money.js'
import { buildCatalog, cityOf, featuredByTier, summarizeCities } from '../../lib/roomSearch.js'
import { getRoomCatalog } from '../../services/hotelService.js'
import { useSelectRoom } from '../search/useSelectRoom.js'
import styles from './HomePage.module.css'

const CITY_IMAGES = { Lagos: lagosImage, Abuja: abujaImage }
const QUICK_SEARCHES = ['Suite', 'Balcony', 'Budget', 'Breakfast']

const PROMISES = [
  { icon: ReceiptText, title: 'All-in prices', text: 'Taxes and fees included from the first screen. No surprises at checkout.' },
  { icon: CreditCard, title: 'Pay your way', text: 'Card, wallet, bank transfer or USSD, with clear help if a payment fails.' },
  { icon: Smartphone, title: 'Check in early', text: 'Share your arrival time before you land and skip the front-desk queue.' },
]

const searchUrl = (query) => `/search?q=${encodeURIComponent(query)}`

export function HomePage() {
  const navigate = useNavigate()
  const selectRoom = useSelectRoom()
  const searchId = useId()
  const [query, setQuery] = useState('')
  const catalogRequest = useAsync(getRoomCatalog, 'catalog')

  const catalog = useMemo(
    () => (catalogRequest.status === 'success' ? buildCatalog(catalogRequest.data) : []),
    [catalogRequest.status, catalogRequest.data],
  )

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
            <p className={styles.eyebrow}>Lagos · Abuja</p>
            <h1 id="home-title" className={styles.heroTitle}>
              Your stay, sorted from the first tap.
            </h1>
            <p className={styles.heroText}>
              Find the right room, see the full price upfront and check in from your phone.
            </p>
            <div className={styles.heroActions}>
              <Link to="/search" className={styles.heroPrimary}>
                Find a room <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/bookings" className={styles.heroSecondary}>
                My bookings
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
                placeholder="e.g. Lekki, suite, balcony"
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

        {catalogRequest.status === 'loading' && <LoadingView label="Loading stays…" />}
        {catalogRequest.status === 'error' && <ErrorView message={catalogRequest.error.message} />}

        {catalogRequest.status === 'success' && (
          <>
            <section className={styles.section} aria-labelledby="cities-heading">
              <h2 id="cities-heading" className={styles.sectionTitle}>
                Explore by city
              </h2>
              <ul className={styles.cities}>
                {summarizeCities(catalog).map(({ city, roomCount, fromRate }) => (
                  <li key={city}>
                    <Link to={searchUrl(city)} className={styles.cityCard}>
                      <img src={CITY_IMAGES[city]} alt="" className={styles.cityImage} loading="lazy" />
                      <span className={styles.cityText}>
                        <span className={styles.cityName}>{city}</span>
                        <span className={styles.cityMeta}>
                          {pluralize(roomCount, 'stay')} · from {formatNaira(fromRate)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

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
                  <li key={`${entry.hotel.id}/${entry.room.id}`}>
                    <article className={styles.featureCard}>
                      <div className={styles.featureMedia}>
                        <img src={entry.room.imageUrl} alt={`${entry.room.name} at ${entry.hotel.name}`} loading="lazy" />
                        <span className={styles.featureTier}>{entry.tier.label}</span>
                      </div>
                      <div className={styles.featureBody}>
                        <h3 className={styles.featureName}>{entry.room.name}</h3>
                        <p className={styles.featureMeta}>
                          {entry.hotel.name} · {cityOf(entry.hotel)}
                        </p>
                        <div className={styles.featureFoot}>
                          <p>
                            <strong>{formatNaira(entry.room.nightlyRate)}</strong>
                            <span className={styles.perNight}> / night</span>
                          </p>
                          <button
                            type="button"
                            className={styles.featureAction}
                            onClick={() => selectRoom(entry)}
                            aria-label={`Book ${entry.room.name} at ${entry.hotel.name}`}
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
          </>
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
