import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { CartContext } from './CartContext.js'
import { createCartService } from './cartService.js'
import { useMarketplaceService } from './MarketplaceContext.js'

// TODO: replace with real API calls
// Keeps each user's cart and saved parts in React state and in sessionStorage ("saved for the
// session": a refresh keeps the cart, closing the tab clears it). Provides the cart service.
// Must be inside AuthProvider and MarketplaceProvider (see app/AppProviders.jsx).
const STORAGE_KEY = 'fastfix.cart'
const EMPTY = { carts: {}, vehicle: null }
const NO_IDS = []

function readStored() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY))
    if (stored && typeof stored.carts === 'object') return { ...EMPTY, ...stored }
  } catch {
    // blocked or corrupt storage: start with an empty cart
  }
  return EMPTY
}

function writeStored(data) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // storage full or blocked: the cart still works until the page is closed
  }
}

export default function CartProvider({ children }) {
  const { user, service: auth } = useAuth()
  const marketplace = useMarketplaceService()
  const [data, setData] = useState(readStored)

  const [service] = useState(() => {
    // Latest data, so a service call made right after a write sees it before React re-renders.
    let latest = data
    const store = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
        writeStored(next)
      },
    }
    return createCartService(store, auth, marketplace)
  })

  const value = useMemo(() => {
    const mine = user ? data.carts[user.id] : null
    return {
      service,
      version: data,
      count: mine ? mine.items.reduce((sum, item) => sum + item.quantity, 0) : 0,
      savedIds: mine?.saved ?? NO_IDS,
      vehicle: data.vehicle,
    }
  }, [service, data, user])

  return <CartContext value={value}>{children}</CartContext>
}
