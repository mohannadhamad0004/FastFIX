import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '../../auth/useAuth.js'
import { TagsContext } from '../../context/TagsContext.js'
import { MarketplaceContext } from '../marketplace/MarketplaceContext.js'
import { OrdersContext } from '../marketplace/OrdersContext.js'
import { RequestsContext } from '../requests/RequestsContext.js'
import { ReviewsContext } from '../requests/ReviewsContext.js'
import { AdminContext } from './AdminContext.js'
import { createAdminService } from './adminService.js'

// TODO: replace with real API calls
// Gives the admin pages the admin service. Mounted by AdminLayout (only admins reach it).
// Mock only: it hands the service the raw stores of the other providers, the way the api's admin
// module reads the database directly.
export default function AdminProvider({ children }) {
  const auth = useContext(AuthContext)
  const marketplace = useContext(MarketplaceContext)
  const requests = useContext(RequestsContext)
  const tags = useContext(TagsContext)
  const reviews = useContext(ReviewsContext)
  const orders = useContext(OrdersContext)

  const [service] = useState(() =>
    createAdminService({
      auth: auth.store,
      marketplace: marketplace.store,
      requests: requests.store,
      tags: tags.store,
      reviews: reviews.store,
      orders: orders.store,
    }, { orders: orders.service }),
  )

  const version = useMemo(
    () => ({
      auth: auth.version,
      marketplace: marketplace.version,
      requests: requests.version,
      tags: tags.version,
      reviews: reviews.version,
      orders: orders.version,
    }),
    [auth.version, marketplace.version, requests.version, tags.version, reviews.version, orders.version],
  )
  const value = useMemo(() => ({ service, version }), [service, version])
  return <AdminContext value={value}>{children}</AdminContext>
}
