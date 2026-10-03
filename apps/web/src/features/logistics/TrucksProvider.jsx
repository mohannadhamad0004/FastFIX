import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '../../auth/useAuth.js'
import { RequestsContext } from '../requests/RequestsContext.js'
import { TrucksContext } from './TrucksContext.js'
import { createTrucksService } from './trucksService.js'

// TODO: replace with real API calls
// Gives the /tow/trucks page the trucks service. Mock only: like AdminProvider, it hands the
// service the raw accounts and requests stores, the way the api reads its tables.
export default function TrucksProvider({ children }) {
  const auth = useContext(AuthContext)
  const requests = useContext(RequestsContext)

  const [service] = useState(() => createTrucksService({ auth: auth.store, requests: requests.store }))

  const version = useMemo(() => ({ auth: auth.version, requests: requests.version }), [auth.version, requests.version])
  const value = useMemo(() => ({ service, version }), [service, version])
  return <TrucksContext value={value}>{children}</TrucksContext>
}
