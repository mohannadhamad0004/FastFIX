import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { EMPTY_FILTERS, filtersFromSearchParams, filtersToSearchParams } from './filters.js'

// The search query and filters live in the URL, so a search can be shared or bookmarked.
export function useMarketplaceFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])

  // replace: true so typing in the search box doesn't add a history entry per keystroke
  const updateFilters = useCallback(
    (changes) =>
      setSearchParams(
        (current) => filtersToSearchParams({ ...filtersFromSearchParams(current), ...changes }),
        { replace: true },
      ),
    [setSearchParams],
  )

  // Clears the search and every filter, but keeps the chosen sort order.
  const clearFilters = useCallback(
    () =>
      setSearchParams(
        (current) =>
          filtersToSearchParams({ ...EMPTY_FILTERS, sort: filtersFromSearchParams(current).sort }),
        { replace: true },
      ),
    [setSearchParams],
  )

  return { filters, updateFilters, clearFilters }
}
