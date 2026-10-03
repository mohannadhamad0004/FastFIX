import { useState } from 'react'
import { useSearchParams } from 'react-router'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import Select from '../../../components/Select.jsx'
import { AskAboutPartButton } from '../../requests/components/RequestButtons.jsx'
import { RESULT_SORTS, sortResults } from '../catalog.js'
import PartBuyActions from './PartBuyActions.jsx'
import PartCard from './PartCard.jsx'
import PartOwnerActions from './PartOwnerActions.jsx'
import VehicleBar from './VehicleBar.jsx'
import View3DButton from './View3DButton.jsx'
import styles from './PartResults.module.css'

const PAGE_SIZE = 12
// Part cards offer the 3D view for accessories and lighting; the part page also has it for body
// parts and tires & wheels.
const CARD_3D_CATEGORIES = ['Accessories', 'Lighting']

/**
 * The results part of the category and search pages: count, sort (?sort=), the active vehicle bar,
 * the grid and "Load more".
 * @param {Object} props
 * @param {import('../types.js').Part[]} props.parts   already filtered, in relevance order
 * @param {Object<string, Object>} props.shopsById
 * @param {Object} props.ratings                       shop ratings (useRatingSummaries)
 * @param {Set<string>} [props.exactIds]                exact part number matches (search): always first
 * @param {Object<string, Object>} [props.highlights]   part id -> search highlight
 * @param {React.ReactNode} [props.empty]               shown when there are no results
 */
export default function PartResults({ parts, shopsById, ratings, exactIds, highlights, empty }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = RESULT_SORTS.some((s) => s.value === searchParams.get('sort')) ? searchParams.get('sort') : 'relevance'
  const [shown, setShown] = useState({ count: PAGE_SIZE, key: '' })

  const sorted = sortResults(parts, sort, ratings)
  // Exact part number matches stay first whatever the sort order.
  const ordered = exactIds?.size ? [...sorted.filter((p) => exactIds.has(p.id)), ...sorted.filter((p) => !exactIds.has(p.id))] : sorted
  // Start from the first page again when the results change (new filter, search or sort).
  const listKey = `${sort}|${ordered.map((p) => p.id).join(',')}`
  const count = shown.key === listKey ? shown.count : PAGE_SIZE
  const visible = ordered.slice(0, count)

  function changeSort(value) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === 'relevance') next.delete('sort')
        else next.set('sort', value)
        return next
      },
      { replace: true },
    )
  }

  return (
    <section className={styles.results} aria-label="Results">
      <VehicleBar />
      <div className={styles.toolbar}>
        <p className={styles.count} aria-live="polite">
          {ordered.length} {ordered.length === 1 ? 'part' : 'parts'}
        </p>
        <label className={styles.sort}>
          <span>Sort by</span>
          <Select size="sm" value={sort} onChange={(event) => changeSort(event.target.value)}>
            {RESULT_SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {ordered.length === 0 ? (
        empty
      ) : (
        <>
          <ul className={styles.grid}>
            {visible.map((part) => {
              const shop = shopsById[part.shopId]
              return (
                <li key={part.id}>
                  <PartCard
                    part={part}
                    shop={shop}
                    shopRating={ratings[part.shopId]}
                    exact={exactIds?.has(part.id)}
                    highlight={highlights?.[part.id] ?? null}
                    footer={
                      <>
                        <PartBuyActions part={part} shop={shop} />
                        <PartOwnerActions part={part} />
                        {CARD_3D_CATEGORIES.includes(part.category) && <View3DButton part={part} />}
                        <AskAboutPartButton part={part} shop={shop} />
                      </>
                    }
                  />
                </li>
              )
            })}
          </ul>
          {visible.length < ordered.length && (
            <div className={styles.more}>
              <p className={styles.muted}>
                Showing {visible.length} of {ordered.length}
              </p>
              <Button variant="secondary" onClick={() => setShown({ count: count + PAGE_SIZE, key: listKey })}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// Default "nothing found" for results.
export function NoResults({ onClear }) {
  return (
    <EmptyState
      icon="🔍"
      title="No parts match"
      description="Try another subcategory, clear the vehicle, or search all shops."
      action={onClear && <Button onClick={onClear}>Show all parts</Button>}
    />
  )
}
