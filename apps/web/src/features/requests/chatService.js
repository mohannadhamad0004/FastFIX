// TODO: replace with real API calls (and a websocket for new messages)
//
// Chats (/chats). Every request has exactly one chat between the customer (or mechanic) who sent
// it and the mechanic, tow company or parts shop it went to, so a chat exists as soon as the
// request does - there is nothing to create. Only those two can read or write it; the api must
// check the same. Messages are text and/or photos.
//
// Mock: messages and read markers live in ChatsProvider's React state (memory only). The provider
// also passes the raw requests and accounts stores, the way the api joins the tables.

import { isApprovedTruck } from '../../auth/reviewItems.js'
import { validateFile } from '../../utils/files.js'

/** @typedef {import('./types.js').ChatMessage} ChatMessage */
/** @typedef {import('./types.js').Request} Request */

export const MESSAGE_MAX_LENGTH = 2000
export const MAX_PHOTOS_PER_MESSAGE = 4

export class ChatError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'ChatError'
    this.field = field
  }
}

/**
 * @typedef {Object} ChatParty  the other person or company in a chat
 * @property {string} id
 * @property {string} name
 * @property {File | null} photo
 * @property {string} role
 */

/**
 * @typedef {Object} ChatSummary  one row of the chat list
 * @property {string} requestId
 * @property {Request} request
 * @property {ChatParty} other
 * @property {ChatMessage | null} lastMessage
 * @property {string} lastActivityAt  ISO date of the last message, or of the request
 * @property {number} unread           messages from the other side not read yet
 */

/**
 * @param {{ read: () => { messages: ChatMessage[], reads: Object }, write: (next: Object) => void }} store
 * @param {{ accounts: { read: () => { users: Object[], sessionUserId: string | null } },
 *           requests: { read: () => { requests: Request[] } } }} stores  raw mock stores
 */
export function createChatService(store, stores) {
  function currentUser() {
    const { users, sessionUserId } = stores.accounts.read()
    return users.find((u) => u.id === sessionUserId) ?? null
  }

  const isParticipant = (request, userId) => request.sender.id === userId || request.target.id === userId

  function participantRequest(requestId, user) {
    const request = stores.requests.read().requests.find((r) => r.id === requestId)
    if (!user || !request || !isParticipant(request, user.id)) return null
    return request
  }

  // Name and photo of the other side, from their account when it exists.
  function otherParty(request, userId) {
    const isSender = request.sender.id === userId
    const party = isSender
      ? { id: request.target.id, name: request.target.name, role: request.target.type }
      : { id: request.sender.id, name: request.sender.name, role: request.sender.role }
    const account = stores.accounts.read().users.find((u) => u.id === party.id)
    return { ...party, photo: account?.profilePhoto ?? null }
  }

  const messagesOf = (requestId) => store.read().messages.filter((m) => m.requestId === requestId)

  function unreadCount(requestId, userId) {
    const lastRead = store.read().reads[requestId]?.[userId] ?? ''
    return messagesOf(requestId).filter((m) => m.senderId !== userId && m.createdAt > lastRead).length
  }

  /** The logged-in user's chats, most recent activity first. @returns {Promise<ChatSummary[]>} */
  async function getMyChats() {
    const user = currentUser()
    if (!user) return []
    return stores.requests
      .read()
      .requests.filter((request) => isParticipant(request, user.id))
      .map((request) => {
        const messages = messagesOf(request.id)
        const lastMessage = messages.at(-1) ?? null
        return {
          requestId: request.id,
          request: structuredClone(request),
          other: otherParty(request, user.id),
          lastMessage: lastMessage && structuredClone(lastMessage),
          lastActivityAt: lastMessage?.createdAt ?? request.createdAt,
          unread: unreadCount(request.id, user.id),
        }
      })
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))
  }

  /**
   * One chat with its request and messages (oldest first). For tow companies, also the approved
   * trucks they can pick when completing the request.
   * @returns {Promise<{ request: Request, other: ChatParty, messages: ChatMessage[], myId: string,
   *   isProvider: boolean, trucks: Object[] } | null>} null when it isn't the user's chat
   */
  async function getChat(requestId) {
    const user = currentUser()
    const request = participantRequest(requestId, user)
    if (!request) return null
    const isProvider = request.target.id === user.id
    return structuredClone({
      request,
      other: otherParty(request, user.id),
      messages: messagesOf(requestId),
      myId: user.id,
      isProvider,
      trucks: isProvider ? (user.trucks ?? []).filter(isApprovedTruck) : [],
    })
  }

  /**
   * @param {string} requestId
   * @param {{ text?: string, photos?: File[] }} message  text, photos (JPG or PNG), or both
   * @returns {Promise<ChatMessage>}
   */
  async function sendMessage(requestId, { text = '', photos = [] }) {
    const user = currentUser()
    if (!participantRequest(requestId, user)) throw new ChatError("You can't write in this chat.")
    const clean = String(text).trim()
    if (!clean && photos.length === 0) throw new ChatError('Write a message or add a photo.', 'message')
    if (clean.length > MESSAGE_MAX_LENGTH) {
      throw new ChatError(`Keep the message under ${MESSAGE_MAX_LENGTH} characters.`, 'message')
    }
    if (photos.length > MAX_PHOTOS_PER_MESSAGE) {
      throw new ChatError(`Send up to ${MAX_PHOTOS_PER_MESSAGE} photos at a time.`, 'photos')
    }
    for (const photo of photos) {
      const problem = validateFile(photo, 'image')
      if (problem) throw new ChatError(problem, 'photos')
    }

    const current = store.read()
    const number = current.messages.reduce((max, m) => Math.max(max, Number(m.id.slice(2)) || 0), 0) + 1
    const createdAt = new Date().toISOString()
    const message = { id: `m-${number}`, requestId, senderId: user.id, text: clean, photos: [...photos], createdAt }
    store.write({
      ...current,
      messages: [...current.messages, message],
      // Writing a message means the chat is read up to here.
      reads: { ...current.reads, [requestId]: { ...current.reads[requestId], [user.id]: createdAt } },
    })
    return structuredClone(message)
  }

  /** Marks the chat read for the logged-in user. Does nothing when nothing is unread. */
  async function markRead(requestId) {
    const user = currentUser()
    if (!participantRequest(requestId, user) || unreadCount(requestId, user.id) === 0) return
    const current = store.read()
    store.write({
      ...current,
      reads: { ...current.reads, [requestId]: { ...current.reads[requestId], [user.id]: new Date().toISOString() } },
    })
  }

  /** Unread messages across all of the logged-in user's chats. @returns {Promise<number>} */
  async function getUnreadCount() {
    const user = currentUser()
    if (!user) return 0
    return stores.requests
      .read()
      .requests.filter((request) => isParticipant(request, user.id))
      .reduce((sum, request) => sum + unreadCount(request.id, user.id), 0)
  }

  return { getMyChats, getChat, sendMessage, markRead, getUnreadCount }
}
