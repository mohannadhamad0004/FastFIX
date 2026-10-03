import { useContext, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { RequestsContext } from '../requests/RequestsContext.js'
import { CartContext } from './CartContext.js'
import { useMarketplaceService } from './MarketplaceContext.js'
import { seedAddresses, seedOrders } from './mockOrders.js'
import { NotificationsContext } from './NotificationsContext.js'
import { OrdersContext } from './OrdersContext.js'
import { createOrdersService } from './ordersService.js'

const seedData = { orders: seedOrders, addresses: seedAddresses }

// TODO: replace with real API calls
// Holds the mock orders in React state and provides the orders service. Memory only.
// Must be inside AuthProvider, MarketplaceProvider, RequestsProvider, CartProvider and NotificationsProvider, and outside
// ReviewsProvider (reviews of completed orders read the orders store). See app/AppProviders.jsx.
export default function OrdersProvider({ children }) {
  const { service: auth } = useAuth()
  const marketplace = useMarketplaceService()
  const requests = useContext(RequestsContext)
  const cart = useContext(CartContext)
  const notifications = useContext(NotificationsContext)
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
    const service = createOrdersService(mockStore, { auth, marketplace, requests: requests.service, cart: cart.service,
      notifications: notifications.service,
    })
    return { service, store: mockStore }
  })

  // `store` is for the mock reviews service (reviews of completed orders).
  const value = useMemo(() => ({ service, version: data, orders: data.orders, store }), [service, data, store])
  return <OrdersContext value={value}>{children}</OrdersContext>
}
