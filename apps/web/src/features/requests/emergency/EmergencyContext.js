import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '../../../auth/useAuth.js'
import { ACTIVE_EMERGENCY } from './constants.js'

// Holds the dispatch service (mockDispatchService.js), the emergencies and the emergency screen's
// open state. The provider is EmergencyProvider.jsx.
export const EmergencyContext = createContext(null)

function useEmergencyContext() {
  const value = useContext(EmergencyContext)
  if (!value) throw new Error('Emergency hooks must be used inside <EmergencyProvider>')
  return value
}

/**
 * const { service, emergencies, mine, open, openScreen, closeScreen } = useEmergency()
 * `emergencies` is every emergency (a mock: the api sends each person only theirs); `mine` is the
 * logged-in customer's active emergency, or the one this visitor just sent.
 */
export function useEmergency() {
  return useEmergencyContext()
}

/** The emergencies the logged-in tow company or mechanic can answer, and the jobs they hold. */
export function useResponderEmergencies() {
  const { user } = useAuth()
  const { emergencies } = useEmergencyContext()
  const open = emergencies.filter(
    (e) => e.status === 'searching' && e.offers.some((o) => o.responderId === user?.id && o.status === 'pending'),
  )
  const jobs = emergencies.filter((e) => e.responder?.id === user?.id && ACTIVE_EMERGENCY.includes(e.status))
  return { open, jobs }
}

/** The current time, updated every `ms`: for countdowns. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(timer)
  }, [ms])
  return now
}
