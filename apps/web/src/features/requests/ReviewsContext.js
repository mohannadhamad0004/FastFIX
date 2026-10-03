import { createContext, useContext, useEffect, useState } from 'react'

// Holds the reviews service and a `version` that changes whenever reviews or requests change (a
// completed request can be reviewed). The provider is ReviewsProvider.jsx.
export const ReviewsContext = createContext(null)

function useReviewsContext() {
  const value = useContext(ReviewsContext)
  if (!value) throw new Error('Reviews hooks must be used inside <ReviewsProvider>')
  return value
}

// The service from reviewsService.js.
export function useReviewsService() {
  return useReviewsContext().service
}

// Loads data through the service, like useMarketplaceQuery: `load` must keep the same identity
// between renders. Reloads whenever reviews or requests change.
export function useReviewsQuery(load) {
  const { service, version } = useReviewsContext()
  const [state, setState] = useState({ data: undefined, error: null, loading: true })

  useEffect(() => {
    let ignore = false
    load(service).then(
      (data) => !ignore && setState({ data, error: null, loading: false }),
      (error) => !ignore && setState({ data: undefined, error, loading: false }),
    )
    return () => {
      ignore = true
    }
  }, [load, service, version])

  return state
}

const loadPrompts = (service) => service.getReviewPrompts()
const NO_PROMPTS = []

// Completed, confirmed requests and orders of the logged-in user that still wait for a review:
// [{ id, targetName, label, closesAt, link }], newest first. Empty for logged-out users.
export function useReviewPrompts() {
  return useReviewsQuery(loadPrompts).data ?? NO_PROMPTS
}

const loadSummaries = (service) => service.getRatingSummaries()
const NO_RATINGS = {}

// Average rating and review count per mechanic / tow company / shop id: { [id]: { average, count } }.
export function useRatingSummaries() {
  return useReviewsQuery(loadSummaries).data ?? NO_RATINGS
}
