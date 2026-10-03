import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '../../auth/useAuth.js'
import { MarketplaceContext } from './MarketplaceContext.js'
import { createMarketplaceService } from './marketplaceService.js'
import { parts as seedParts, shops } from './mockData.js'
import { seedReservedByPart } from './mockOrders.js'

// Parts start with the units already reserved by seed orders (mockOrders.js).
const parts = seedParts.map((part) => ({ ...part, reserved: seedReservedByPart[part.id] ?? 0 }))
const seedData = { shops, parts }

// TODO: replace mock implementation with real API calls
// Holds the mock marketplace data in React state and gives pages the service that reads and
// writes it. Once the real API exists, the data moves to apps/api and this only signals changes.
// Must be inside AuthProvider: writes check the logged-in user through the auth service.
export default function MarketplaceProvider({ children }) {
  const { service: auth, store: authStore } = useContext(AuthContext)
  // Accounts survive a refresh (auth/sessionPersistence.js) but this data doesn't, so re-apply
  // parts shop suspensions from the accounts on startup.
  // TODO: remove when real backend auth exists
  const [data, setData] = useState(() => {
    const suspended = new Set(authStore.read().users.filter((u) => u.suspended).map((u) => u.id))
    return suspended.size ? { ...seedData, shops: shops.map((s) => ({ ...s, suspended: suspended.has(s.id) })) } : seedData
  })

  const [{ service, store }] = useState(() => {
    // Latest data, so a service call made right after a write sees it before React re-renders.
    let latest = data
    const mockStore = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
    // Shops show the public details from their accounts (name, logo, address, photos...).
    const readAccounts = () => authStore.read().users
    return { service: createMarketplaceService(mockStore, auth, readAccounts), store: mockStore }
  })

  // `store` is for the mock admin service only (hiding parts, tags, suspended shops).
  const value = useMemo(() => ({ service, version: data, store }), [service, data, store])
  return <MarketplaceContext value={value}>{children}</MarketplaceContext>
}
