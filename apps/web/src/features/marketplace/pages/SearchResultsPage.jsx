import { useSearchParams } from 'react-router'
import EmptyState from '../../../components/EmptyState.jsx'
import SearchBar from '../../../components/SearchBar.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import { mostPopular, onOffer, recentlyAdded, recentlyUpdated } from '../catalog.js'
import Breadcrumb from '../components/Breadcrumb.jsx'
import PartResults from '../components/PartResults.jsx'
import { usePartSearch } from '../usePartSearch.js'
import { useMarketplaceData } from '../useMarketplaceData.js'
import styles from './CatalogPage.module.css'

// The "View all" lists of the home page rows (?list=...), when there is no search.
const LISTS = {
  popular: { title: 'Most popular', pick: (parts) => mostPopular(parts) },
  new: { title: 'Recently added', pick: (parts) => recentlyAdded(parts) },
  updated: { title: 'Recently updated', pick: (parts) => recentlyUpdated(parts) },
  offers: { title: 'On offer', pick: (parts, tags) => onOffer(parts, tags) },
}

const byRelevance = (a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0) || b.addedAt.localeCompare(a.addedAt)

// /marketplace/search?q=1K0615301AA - the server-side part search (part numbers in any format,
// several words, typos, synonyms, compatible vehicles), laid out like a category page: exact part
// number matches first, "Did you mean…?" for misspelled makes and models, sort, the vehicle bar and
// "Load more". Only parts that fit the selected vehicle are shown. Without a query it lists every
// part, or one of the home page lists (?list=popular | new | updated | offers).
export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const list = LISTS[searchParams.get('list')] ?? null
  const search = usePartSearch(q)
  const { loading, error, fitting, shopsById, ratings, tags } = useMarketplaceData()

  const setQuery = (value) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('list')
        if (value) next.set('q', value)
        else next.delete('q')
        return next
      },
      { replace: true },
    )

  let results = []
  let exactIds
  let highlights
  if (q) {
    // The search runs on the server; stock, prices and the vehicle filter come from the marketplace data.
    const fitById = new Map(fitting.map((part) => [part.id, part]))
    const found = (search.data?.results ?? []).filter((result) => fitById.has(result.part.id))
    results = found.map((result) => fitById.get(result.part.id))
    exactIds = new Set(found.filter((result) => result.exact).map((result) => result.part.id))
    highlights = Object.fromEntries(found.map((result) => [result.part.id, result.highlight]))
  } else {
    results = list ? list.pick(fitting, tags) : [...fitting].sort(byRelevance)
  }

  const title = q ? `Results for “${q}”` : (list?.title ?? 'All parts')
  const suggestion = q ? search.data?.suggestion : null
  const waiting = loading || (q && !search.data && !search.error)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Breadcrumb items={[{ label: 'Marketplace', to: '/marketplace' }, { label: q ? 'Search' : title }]} />
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.searchBox}>
          <SearchBar value={q} onChange={setQuery} />
        </div>
      </header>

      {suggestion && (
        <p className={styles.suggestion}>
          Did you mean{' '}
          <button type="button" className={styles.suggestionButton} onClick={() => setQuery(suggestion.query)}>
            {suggestion.label}
          </button>
          ?
        </p>
      )}

      {error || (q && search.error) ? (
        <EmptyState icon="⚠" title="Couldn't search right now" description="Please try again in a moment." />
      ) : waiting ? (
        <SkeletonCards count={6} media label="Searching…" />
      ) : (
        <PartResults
          parts={results}
          shopsById={shopsById}
          ratings={ratings}
          exactIds={exactIds}
          highlights={highlights}
          empty={
            <EmptyState
              icon="🔍"
              title="No parts match your search"
              description="Try a different part number or fewer words, or clear the vehicle to search every car."
            />
          }
        />
      )}
    </div>
  )
}
