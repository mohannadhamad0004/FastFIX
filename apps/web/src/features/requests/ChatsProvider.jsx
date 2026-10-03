import { useContext, useMemo, useState } from 'react'
import { AuthContext } from '../../auth/useAuth.js'
import { ChatsContext } from './ChatsContext.js'
import { createChatService } from './chatService.js'
import { seedMessages, seedReads } from './mockChats.js'
import { RequestsContext } from './RequestsContext.js'

const seedData = { messages: seedMessages, reads: seedReads }

// TODO: replace with real API calls
// Holds the mock chat messages in React state and provides the chat service. Memory only.
// Like AdminProvider, it hands the service the raw accounts and requests stores (names, photos,
// who may read a chat). Must be inside AuthProvider and RequestsProvider (app/AppProviders.jsx).
export default function ChatsProvider({ children }) {
  const auth = useContext(AuthContext)
  const requests = useContext(RequestsContext)
  const [data, setData] = useState(seedData)

  const [service] = useState(() => {
    // Latest data, so a service call made right after a write sees it before React re-renders.
    let latest = seedData
    const store = {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
    return createChatService(store, { accounts: auth.store, requests: requests.store })
  })

  const version = useMemo(
    () => ({ chats: data, requests: requests.version, auth: auth.version }),
    [data, requests.version, auth.version],
  )
  const value = useMemo(() => ({ service, version }), [service, version])
  return <ChatsContext value={value}>{children}</ChatsContext>
}
