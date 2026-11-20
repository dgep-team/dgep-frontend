import { SearchX } from 'lucide-react'
import { useDeferredValue, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { ErrorView, LoadingView } from '../../components/feedback/StatusView.jsx'
import { Screen } from '../../components/layout/AppShell.jsx'
import { ScreenHeader } from '../../components/layout/ScreenHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { pluralize } from '../../lib/dates.js'
import { buildCatalog, PRICE_TIERS, searchCatalog, SORT_OPTIONS } from '../../lib/roomSearch.js'
import { errorMessage } from '../../services/api/errors.js'
import { searchStays } from '../../services/hotelService.js'
import { useBookingFlow } from '../../state/bookingFlowContext.js'
import { StayDetailsCard } from '../booking/components/StayDetailsCard.jsx'
import { RoomResultCard } from './components/RoomResultCard.jsx'
import { SearchControls } from './components/SearchControls.jsx'
import { useSelectRoom } from './useSelectRoom.js'
import styles from './components/Search.module.css'

const VALID_TIERS = new Set(['all', ...PRICE_TIERS.map((tier) => tier.id)])
const VALID_SORTS = new Set(SORT_OPTIONS.map((option) => option.value))

/**
 * Room search. The API is asked for rooms free on the chosen dates (only
 * ACTIVE hotels are listed); keyword, price band and sort then filter those
 * locally and live in the URL (?q=&tier=&sort=) so Back and refresh keep them.
 */
export function SearchPage() {
  const { draft, updateDraft } = useBookingFlow()
  const selectRoom = useSelectRoom()
  const [params, setParams] = useSearchParams()
  const { checkIn, checkOut, guests } = draft
  const stays = useAsync((signal) => searchStays({ checkIn, checkOut, guests, signal }), `${checkIn}|${checkOut}|${guests}`)

  const query = params.get('q') ?? ''
  const tier = VALID_TIERS.has(params.get('tier')) ? params.get('tier') : 'all'
  const sort = VALID_SORTS.has(params.get('sort')) ? params.get('sort') : 'price-asc'
  const deferredQuery = useDeferredValue(query)

  const catalog = useMemo(() => (stays.status === 'success' ? buildCatalog(stays.data) : []), [stays.status, stays.data])
  const results = useMemo(() => searchCatalog(catalog, { query: deferredQuery, tier, sort }), [catalog, deferredQuery, tier, sort])

  const setParam = (key, value, fallback) => {
    // Start from the live URL, not the render-time params: two quick changes
    // would otherwise undo each other.
    const next = new URLSearchParams(window.location.search)
    if (!value || value === fallback) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  // A new date or party size invalidates any unpaid booking made for the old one.
  const changeStay = (changes) => updateDraft({ ...changes, pending: null })

  return (
    <Screen header={<ScreenHeader title="Find a room" backTo="/home" />}>
      <StayDetailsCard draft={draft} onChange={changeStay} />

      <SearchControls
        query={query}
        onQueryChange={(value) => setParam('q', value, '')}
        tier={tier}
        onTierChange={(value) => setParam('tier', value, 'all')}
        sort={sort}
        onSortChange={(value) => setParam('sort', value, 'price-asc')}
      />

      {stays.status === 'loading' && <LoadingView label="Finding free rooms…" />}
      {stays.status === 'error' && (
        <ErrorView message={errorMessage(stays.error)} actionLabel="Try again" onAction={stays.reload} />
      )}

      {stays.status === 'success' && (
        <>
          <p className={styles.resultCount} aria-live="polite">
            {pluralize(results.length, 'room')} {query ? `matching “${query.trim()}”` : 'available'} for{' '}
            {pluralize(guests, 'guest')}
          </p>

          {results.length > 0 ? (
            <ul className={styles.grid}>
              {results.map((entry) => (
                <li key={entry.roomType.id}>
                  <RoomResultCard entry={entry} selected={entry.roomType.id === draft.roomTypeId} onSelect={selectRoom} />
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.empty}>
              <SearchX size={40} aria-hidden="true" />
              <p className={styles.emptyTitle}>No rooms match your search</p>
              <p>
                {catalog.length === 0
                  ? 'Every room is booked for these dates. Try different dates or fewer guests.'
                  : 'Try fewer words, or search by city, bed type or amenity.'}
              </p>
              {catalog.length > 0 && (
                <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                  Clear search and filters
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </Screen>
  )
}
