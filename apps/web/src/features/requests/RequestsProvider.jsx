import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { useMarketplaceService } from '../marketplace/MarketplaceContext.js'
import { seedRequests } from './mockRequests.js'
import { RequestsContext } from './RequestsContext.js'
import { createRequestsService } from './requestsService.js'

const seedData = { requests: seedRequests }

// TODO: replace with real API calls
// Holds the mock requests in React state and provides the requests service.
// Must be inside AuthProvider and MarketplaceProvider (see app/AppProviders.jsx).
export default function RequestsProvider({ children }) {
  const { service: auth } = useAuth()
  const marketplace = useMarketplaceService()
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
    return { service: createRequestsService(mockStore, { auth, marketplace }), store: mockStore }
  })

  // `store` is for mock services that read requests like the api: the admin request monitor and
  // the trucks service (a truck on an active tow request can't be removed).
  const value = useMemo(() => ({ service, version: data, store }), [service, data, store])
  return <RequestsContext value={value}>{children}</RequestsContext>
}
