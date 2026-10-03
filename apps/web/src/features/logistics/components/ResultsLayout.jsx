import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import Select from '../../../components/Select.jsx'
import ResultsMap from './ResultsMap.jsx'
import styles from './ResultsLayout.module.css'

/**
 * The results of /tow-companies and /mechanics: cards on the left and the map on the right (phones: cards first, "Show map" switches).
 * Clicking a marker highlights its card and scrolls it into view.
 * @param {Object} props
 * @param {{ item: Object, distanceKm: number | null }[]} props.results
 * @param {(result: { item: Object, distanceKm: number | null }, extra: { highlighted: boolean }) => React.ReactNode} props.renderCard
 * @param {{ value: string, label: string }[]} props.sorts   the sort options; 'nearest' is disabled without an origin
 * @param {string} props.noun        'company' or 'mechanic', for the count
 * @param {string} props.emptyTitle
 * @param {'truck' | 'wrench'} [props.pin]   marker icon
 * @param {(item: Object) => string} [props.getName]  marker name
 * @param {{ lat: number, lng: number } | null} props.origin
 * @param {boolean} props.isUserLocation   origin is the customer's own location (gets a marker)
 * @param {string} props.summary           e.g. 'Companies covering "Nablus"'
 * @param {string} props.sort
 * @param {(sort: string) => void} props.onSortChange
 * @param {boolean} props.canSortNearest   false without an origin
 * @param {{ name: string }[]} props.nearbyCities  suggested in the empty state
 * @param {(city: string) => void} props.onPickCity
 * @param {React.ReactNode} [props.filters]      shown above the results, also when there are none
 * @param {React.ReactNode} [props.emptyAction]  extra action in the empty state (e.g. "Show all")
 * @param {React.ReactNode} [props.note]   shown above the list (e.g. "available now only")
 */
export default function ResultsLayout({
  results,
  renderCard,
  sorts,
  noun,
  emptyTitle,
  pin,
  getName,
  origin,
  isUserLocation,
  summary,
  sort,
  onSortChange,
  canSortNearest,
  nearbyCities,
  onPickCity,
  note,
  filters = null,
  emptyAction = null,
}) {
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('list') // phones only
  const [hoveredId, setHoveredId] = useState(null) // the card under the pointer or with focus: its marker lights up too

  function select(id) {
    setSelectedId(id)
    document.getElementById(`result-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  if (results.length === 0) {
    return (
      <section id="results" className={styles.results}>
        {filters}
        <EmptyState
          icon="🚚"
          title={emptyTitle}
          description={
            nearbyCities.length > 0
              ? 'Try a nearby city, or remove a filter.'
              : 'Try a different city or remove a filter.'
          }
          action={
            (nearbyCities.length > 0 || emptyAction) && (
              <div className={styles.suggestions}>
                {nearbyCities.map((city) => (
                  <Button key={city.name} variant="secondary" onClick={() => onPickCity(city.name)}>
                    Try {city.name}
                  </Button>
                ))}
                {emptyAction}
              </div>
            )
          }
        />
      </section>
    )
  }

  return (
    <section id="results" className={styles.results} aria-label="Search results">
      <div className={styles.bar}>
        {filters}
        <label className={styles.sort}>
          <span className={styles.sortLabel}>Sort</span>
          <Select size="sm" value={sort} onChange={(event) => onSortChange(event.target.value)}>
            {sort === 'search' && <option value="search">Best match</option>}
            {sorts.map((item) => (
              <option key={item.value} value={item.value} disabled={item.value === 'nearest' && !canSortNearest}>
                {item.label}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className={styles.toolbar}>
        <p className={styles.summary} aria-live="polite">
          <strong>{results.length}</strong> {results.length === 1 ? noun : noun === 'company' ? 'companies' : `${noun}s`} · {summary}
        </p>
        <div className={styles.toggle} role="group" aria-label="Results view">
          <button type="button" className={styles.toggleButton} aria-pressed={view === 'list'} onClick={() => setView('list')}>
            List
          </button>
          <button type="button" className={styles.toggleButton} aria-pressed={view === 'map'} onClick={() => setView('map')}>
            Map
          </button>
        </div>
      </div>
      {note}

      <div className={styles.layout} data-view={view}>
        <ul className={styles.list}>
          {results.map((result) => (
            <li
              key={result.item.id}
              id={`result-${result.item.id}`}
              onMouseEnter={() => setHoveredId(result.item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(result.item.id)}
              onBlur={() => setHoveredId(null)}
            >
              {renderCard(result, {
                highlighted: result.item.id === selectedId,
              })}
            </li>
          ))}
        </ul>
        <div className={styles.map}>
          {/* key: a map made while hidden has no size, so it is rebuilt when "Show map" shows it */}
          <ResultsMap key={view} origin={origin} isUserLocation={isUserLocation} results={results} selectedId={hoveredId ?? selectedId} onSelect={select} pin={pin} getName={getName} />
        </div>
      </div>
    </section>
  )
}
