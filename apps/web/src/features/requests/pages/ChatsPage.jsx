import { useParams } from 'react-router'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import ChatList from '../components/ChatList.jsx'
import Conversation from '../components/Conversation.jsx'
import { useChatsQuery } from '../ChatsContext.js'
import styles from './ChatsPage.module.css'

const loadChats = (service) => service.getMyChats()

// /chats and /chats/:requestId - customers, mechanics, parts shops and tow companies. Every request
// has a chat between its sender and the provider. Wide screens show the list on the left and the
// open chat on the right; phones show the list first, then the chat (with a back button).
export default function ChatsPage() {
  const { requestId } = useParams()
  const { data: chats, error } = useChatsQuery(loadChats)
  const unread = chats?.reduce((sum, chat) => sum + chat.unread, 0) ?? 0

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Chats</h1>
        <p className={styles.subtitle}>
          One chat per request.
          {unread > 0 && ` ${unread} unread ${unread === 1 ? 'message' : 'messages'}.`}
        </p>
      </header>

      <div className={`${styles.layout} ${requestId ? styles.hasChat : ''}`}>
        <aside className={styles.listPane}>
          {error && <p className={styles.muted}>Couldn't load your chats.</p>}
          {!chats && !error && <SkeletonRows rows={4} label="Loading chats…" />}
          {chats?.length === 0 && (
            <EmptyState
              compact
              icon="💬"
              title="No chats yet"
              description="A chat starts when a request is sent: service, tow or a question about a part."
            />
          )}
          {chats?.length > 0 && <ChatList chats={chats} />}
        </aside>

        <div className={styles.chatPane}>
          {requestId ? (
            <Conversation key={requestId} requestId={requestId} backTo="/chats" />
          ) : (
            <p className={styles.placeholder}>Choose a chat to read and reply.</p>
          )}
        </div>
      </div>
    </div>
  )
}
