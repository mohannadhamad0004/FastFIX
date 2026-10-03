import { NavLink } from 'react-router'
import Avatar from '../../../components/Avatar.jsx'
import { REQUEST_TYPE_SHORT, requestStatusBadge } from '../constants.js'
import styles from './ChatList.module.css'

// "14:05" today, "3 Oct" otherwise
function shortTime(iso) {
  const date = new Date(iso)
  return date.toDateString() === new Date().toDateString()
    ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function lastLine(chat) {
  const message = chat.lastMessage
  if (!message) return 'Request sent - no messages yet'
  const prefix = message.senderId === chat.other.id ? '' : 'You: '
  if (message.text) return `${prefix}${message.text}`
  return `${prefix}📷 Photo${message.photos.length > 1 ? 's' : ''}`
}

// The chat list: the other side's photo and name, request type and status, the last message, its
// time and the unread count. Each row opens /chats/:requestId.
export default function ChatList({ chats }) {
  return (
    <ul className={styles.list} aria-label="Chats">
      {chats.map((chat) => {
        const status = requestStatusBadge(chat.request.status)
        return (
          <li key={chat.requestId}>
            <NavLink
              to={`/chats/${chat.requestId}`}
              className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
            >
              <Avatar file={chat.other.photo} name={chat.other.name} />
              <span className={styles.text}>
                <span className={styles.top}>
                  <span className={styles.name}>{chat.other.name}</span>
                  <span className={styles.time}>{shortTime(chat.lastActivityAt)}</span>
                </span>
                <span className={styles.meta}>
                  {REQUEST_TYPE_SHORT[chat.request.type]} · {status.label}
                </span>
                <span className={styles.bottom}>
                  <span className={chat.unread ? styles.lastUnread : styles.last}>{lastLine(chat)}</span>
                  {chat.unread > 0 && (
                    <span className={styles.unread}>
                      {chat.unread}
                      <span className={styles.srOnly}> unread</span>
                    </span>
                  )}
                </span>
              </span>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}
