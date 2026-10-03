import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { ROLES } from '../../authorization/roles.js'
import { ORDER_STATUS } from './orderConstants.js'

// Holds the orders service and a `version` that changes whenever an order is placed or changes.
// The provider is OrdersProvider.jsx.
export const OrdersContext = createContext(null)

function useOrdersContext() {
  const value = useContext(OrdersContext)
  if (!value) throw new Error('Orders hooks must be used inside <OrdersProvider>')
  return value
}

// The service from ordersService.js: getCheckoutOptions, addAddress, placeOrder, getMyOrders,
// getOrder, getCheckout, cancelOrder, buyAgain, openShopChat (buyers); getShopOrders, getShopOrder,
// confirmOrder, rejectOrder, advanceOrder, markOrderPaid (shops); cancelOrderAsAdmin (admins).
export function useOrdersService() {
  return useOrdersContext().service
}

// How many new orders (not confirmed yet) the logged-in parts shop has, for the badges on its
// dashboard and menu. 0 for everyone else. Reads only the shop's own orders.
export function useNewShopOrders() {
  const { user } = useAuth()
  const { orders } = useOrdersContext()
  if (user?.role !== ROLES.PARTS_SHOP) return 0
  return orders.filter((order) => order.shopId === user.id && order.status === ORDER_STATUS.PLACED).length
}

// Loads data through the service, like useMarketplaceQuery: `load` must keep the same identity
// between renders. Reloads whenever an order changes.
export function useOrdersQuery(load) {
  const { service, version } = useOrdersContext()
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
