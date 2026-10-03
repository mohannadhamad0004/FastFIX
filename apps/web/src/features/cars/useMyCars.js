import { useCallback } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { useCarsQuery } from './CarsContext.js'

const NONE = []

// The logged-in customer's cars: { cars, loading }. `cars` is [] when logged out or for other roles.
// Used by /my-cars and the car selectors in the diagnosis card and "Request service".
export function useMyCars() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // A new load function per user, so the cars reload after logging in or out.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback((service) => service.getMyCars(), [userId])
  const { data, loading } = useCarsQuery(load)
  return { cars: data ?? NONE, loading }
}
