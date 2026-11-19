import { ArrowUpDown, Search, X } from 'lucide-react'
import { useId } from 'react'
import { PRICE_TIERS, SORT_OPTIONS } from '../../../lib/roomSearch.js'
import styles from './Search.module.css'

const TIER_OPTIONS = [{ id: 'all', label: 'All rooms' }, ...PRICE_TIERS]

export function SearchControls({ query, onQueryChange, tier, onTierChange, sort, onSortChange }) {
  const inputId = useId()
  const sortId = useId()

  return (
    <div className={styles.controls}>
      <form role="search" className={styles.searchBox} onSubmit={(event) => event.preventDefault()}>
        <label htmlFor={inputId} className="visually-hidden">
          Search rooms
        </label>
        <Search size={20} className={styles.searchIcon} aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          className={styles.searchInput}
          placeholder="Search rooms, areas or amenities"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
        {query && (
          <button type="button" className={styles.clearButton} onClick={() => onQueryChange('')} aria-label="Clear search">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </form>

      <div className={styles.filterRow}>
        <div className={styles.chips} role="group" aria-label="Price range">
          {TIER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.chip} ${tier === option.id ? styles.chipActive : ''}`}
              aria-pressed={tier === option.id}
              onClick={() => onTierChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className={styles.sort}>
          <ArrowUpDown size={16} aria-hidden="true" />
          <label htmlFor={sortId} className="visually-hidden">
            Sort by
          </label>
          <select id={sortId} value={sort} onChange={(event) => onSortChange(event.target.value)} className={styles.sortSelect}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
