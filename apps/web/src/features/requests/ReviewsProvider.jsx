import { useContext, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { OrdersContext } from '../marketplace/OrdersContext.js'
import { seedReviewReports, seedReviews } from './mockReviews.js'
import { RequestsContext } from './RequestsContext.js'
import { ReviewsContext } from './ReviewsContext.js'
import { createReviewsService } from './reviewsService.js'

// adminLog: what admins did to reviews (hide, unhide, dismiss), newest last
const seedData = { reviews: seedReviews, reports: seedReviewReports, adminLog: [] }

// TODO: replace with real API calls
// Holds the mock reviews in React state and provides the reviews service. Memory only.
// Must be inside AuthProvider, RequestsProvider and OrdersProvider (see app/AppProviders.jsx).
export default function ReviewsProvider({ children }) {
  const { service: auth } = useAuth()
  const requests = useContext(RequestsContext)
  const orders = useContext(OrdersContext)
  const [data, setData] = useState(seedData)

  const [{ service, store }] = useState(() => {
    // Latest data, so a service call made right after a write sees it before React re-renders.
    let latest = seedData
    const mockStore = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
    return { service: createReviewsService(mockStore, { auth, requests: requests.store, orders: orders.store }), store: mockStore }
  })

  // `store` is for the mock admin service only (hiding reviews, dismissing reports).
  const version = useMemo(() => ({ reviews: data, requests: requests.version }), [data, requests.version])
  const value = useMemo(() => ({ service, version, store }), [service, version, store])
  return <ReviewsContext value={value}>{children}</ReviewsContext>
}
