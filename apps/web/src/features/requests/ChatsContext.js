import { createContext, useContext, useEffect, useState } from 'react'

// Holds the chat service and a `version` that changes with every message, read marker, request or
// login. The provider is ChatsProvider.jsx.
export const ChatsContext = createContext(null)

function useChatsContext() {
  const value = useContext(ChatsContext)
  if (!value) throw new Error('Chat hooks must be used inside <ChatsProvider>')
  return value
}

// The service from chatService.js: getMyChats, getChat, sendMessage, markRead, getUnreadCount.
export function useChatService() {
  return useChatsContext().service
}

// Loads data through the service, like useMarketplaceQuery: `load` must keep the same identity
// between renders. Reloads whenever chats, requests or the logged-in user change.
export function useChatsQuery(load) {
  const { service, version } = useChatsContext()
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

const loadUnread = (service) => service.getUnreadCount()

// Unread messages across the logged-in user's chats (for the account menu).
export function useUnreadChats() {
  return useChatsQuery(loadUnread).data ?? 0
}
