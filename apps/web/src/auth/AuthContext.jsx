import { useEffect, useMemo, useState } from 'react'
import { createAuthService, toPublicUser } from './authService.js'
import { seedUsers } from './mockUsers.js'
import { loadAuthState, saveAuthState } from './sessionPersistence.js'
import { AuthContext } from './useAuth.js'

const seedData = { users: seedUsers, sessionUserId: null, resetTokens: [] }

// TODO: replace mock implementation with real API calls
// Holds the mock accounts and the logged-in user in React state and gives components the auth
// service that reads and writes them (read it with useAuth()). The state is also kept in
// sessionStorage (sessionPersistence.js), so a refresh keeps you logged in.
export default function AuthProvider({ children }) {
  // TODO: remove when real backend auth exists (sessionStorage restore)
  const [data, setData] = useState(() => loadAuthState(seedData))

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
    return { service: createAuthService(mockStore), store: mockStore }
  })

  // TODO: remove when real backend auth exists (sessionStorage save)
  useEffect(() => {
    saveAuthState(data, seedUsers)
  }, [data])

  const { users, sessionUserId } = data
  const user = useMemo(() => {
    const current = users.find((u) => u.id === sessionUserId)
    return current ? toPublicUser(current) : null
  }, [users, sessionUserId])

  // `store` is for the mock admin service only (it edits accounts like the api edits the database).
  const value = useMemo(() => ({ service, user, version: data, store }), [service, user, data, store])
  return <AuthContext value={value}>{children}</AuthContext>
}
