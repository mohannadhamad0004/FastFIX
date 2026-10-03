import { createContext, useContext, useEffect, useState } from 'react'
import { MarketplaceContext } from './MarketplaceContext.js'

// Holds the cart service, plus the numbers every page header needs without waiting for a promise:
// how many items are in the cart, which parts are saved, and the vehicle chosen for fit warnings.
// The provider is CartProvider.jsx.
export const CartContext = createContext(null)

function useCartContext() {
  const value = useContext(CartContext)
  if (!value) throw new Error('Cart hooks must be used inside <CartProvider>')
  return value
}

/**
 * const { count, savedIds, vehicle, service } = useCart()
 * `service` is cartService.js: getCartView, addItem, setQuantity, removeItem, clear, acceptChanges,
 * getSavedParts, toggleSaved, moveToCart, setVehicle.
 */
export function useCart() {
  const { service, count, savedIds, vehicle } = useCartContext()
  return { service, count, savedIds, vehicle }
}

// Loads data through the cart service, like useMarketplaceQuery: `load` must keep the same
// identity between renders. Reloads whenever the cart or the marketplace (prices, stock) changes.
export function useCartQuery(load) {
  const { service, version } = useCartContext()
  const marketplace = useContext(MarketplaceContext)
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
  }, [load, service, version, marketplace?.version])

  return state
}
