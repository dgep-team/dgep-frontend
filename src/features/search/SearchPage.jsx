import { CalendarDays, SearchX } from 'lucide-react'
import { useDeferredValue, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { formatDateRange, nightsBetween, pluralize } from '../../lib/dates.js'
import { buildCatalog, PRICE_TIERS, searchCatalog, SORT_OPTIONS } from '../../lib/roomSearch.js'
import { getRoomCatalog } from '../../services/hotelService.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'
import { RoomResultCard } from './components/RoomResultCard.jsx'
import { SearchControls } from './components/SearchControls.jsx'
import { useSelectRoom } from './useSelectRoom.js'
import styles from './components/Search.module.css'

const VALID_TIERS = new Set(['all', ...PRICE_TIERS.map((tier) => tier.id)])
const VALID_SORTS = new Set(SORT_OPTIONS.map((option) => option.value))

/**
 * Room search. Keyword, price band and sort live in the URL (?q=&tier=&sort=)
 * so results survive a refresh, can be shared, and Back restores them.
 */
export function SearchPage() {
  const { draft } = useBookingFlow()
  const selectRoom = useSelectRoom()
  const [params, setParams] = useSearchParams()
  const catalogRequest = useAsync(getRoomCatalog, 'catalog')

  const query = params.get('q') ?? ''
  const tier = VALID_TIERS.has(params.get('tier')) ? params.get('tier') : 'all'
  const sort = VALID_SORTS.has(params.get('sort')) ? params.get('sort') : 'price-asc'
  // Keep typing responsive; the list catches up a frame later.
  const deferredQuery = useDeferredValue(query)

  const catalog = useMemo(
    () => (catalogRequest.status === 'success' ? buildCatalog(catalogRequest.data) : []),
    [catalogRequest.status, catalogRequest.data],
  )
  const results = useMemo(
    () => searchCatalog(catalog, { query: deferredQuery, tier, sort }),
    [catalog, deferredQuery, tier, sort],
  )

  const setParam = (key, value, fallback) => {
    // Start from the live URL, not the render-time params: React Router's
    // functional updater sees the last render's values, so two quick changes
    // (clear, then pick a tier) would otherwise undo each other.
    const next = new URLSearchParams(window.location.search)
    if (!value || value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }


  const header = <ScreenHeader title="Find a room" backTo="/home" />

  if (catalogRequest.status === 'loading') return <Screen header={header}><LoadingView label="Loading rooms…" /></Screen>
  if (catalogRequest.status === 'error') {
    return <Screen header={header}><ErrorView message={catalogRequest.error.message} /></Screen>
  }

  const nights = nightsBetween(draft.checkIn, draft.checkOut)

  return (
    <Screen header={header}>
      <p className={styles.staySummary}>
        <CalendarDays size={16} aria-hidden="true" />
        <span>
          Prices for {formatDateRange(draft.checkIn, draft.checkOut)} · {pluralize(nights, 'night')} ·{' '}
          {pluralize(draft.guests, 'guest')}
        </span>
        <Link to="/booking" className={styles.staySummaryLink}>
          Change
        </Link>
      </p>

      <SearchControls
        query={query}
        onQueryChange={(value) => setParam('q', value, '')}
        tier={tier}
        onTierChange={(value) => setParam('tier', value, 'all')}
        sort={sort}
        onSortChange={(value) => setParam('sort', value, 'price-asc')}
      />

      <p className={styles.resultCount} aria-live="polite">
        {pluralize(results.length, 'room')} {query ? `matching “${query.trim()}”` : 'available'}
      </p>

      {results.length > 0 ? (
        <ul className={styles.grid}>
          {results.map((entry) => (
            <li key={`${entry.hotel.id}/${entry.room.id}`}>
              <RoomResultCard
                entry={entry}
                stay={draft}
                selected={entry.hotel.id === draft.hotelId && entry.room.id === draft.roomId}
                onSelect={selectRoom}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <SearchX size={40} aria-hidden="true" />
          <p className={styles.emptyTitle}>No rooms match your search</p>
          <p>Try fewer words, or search by area, bed type or amenity.</p>
          <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
            Clear search and filters
          </Button>
        </div>
      )}
    </Screen>
  )
}
