import { useObjectUrl } from '../../../hooks/useObjectUrl.js'
import { formatDateTime } from '../format.js'
import styles from './Conversation.module.css'

/** One chat bubble: photos and/or text, and the time. Used by chats and the emergency screen. */
export default function ChatMessage({ message, mine }) {
  return (
    <li className={`${styles.message} ${mine ? styles.mine : styles.theirs}`}>
      <div className={styles.bubble}>
        {message.photos.length > 0 && (
          <div className={styles.photos}>
            {message.photos.map((photo, index) => (
              <MessagePhoto key={`${photo.name}-${index}`} file={photo} />
            ))}
          </div>
        )}
        {message.text && <p className={styles.text}>{message.text}</p>}
      </div>
      <span className={styles.time}>
        {mine ? 'You · ' : ''}
        {formatDateTime(message.createdAt)}
      </span>
    </li>
  )
}

function MessagePhoto({ file }) {
  const url = useObjectUrl(file)
  return (
    <a href={url ?? undefined} target="_blank" rel="noreferrer" className={styles.photoLink}>
      {url && <img src={url} alt={`Photo: ${file.name}`} className={styles.photo} />}
    </a>
  )
}
