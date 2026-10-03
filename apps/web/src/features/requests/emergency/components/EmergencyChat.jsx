import { useEffect, useRef } from 'react'
import { useEmergency } from '../EmergencyContext.js'
import ChatMessage from '../../components/ChatMessage.jsx'
import MessageComposer from '../../components/MessageComposer.jsx'
import chatStyles from '../../components/Conversation.module.css'
import styles from './EmergencyChat.module.css'

/**
 * The chat on the emergency screen, between the customer and the responder who accepted. It reuses
 * the chat bubbles and the composer of /chats; the messages belong to the emergency.
 * @param {{ emergency: import('../types.js').Emergency, side: 'customer' | 'responder' }} props  side: who is looking
 */
export default function EmergencyChat({ emergency, side }) {
  const { service } = useEmergency()
  const endRef = useRef(null)
  const count = emergency.messages.length

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [count])

  return (
    <section className={styles.chat} aria-label="Chat">
      <h3 className={styles.title}>Chat with {side === 'customer' ? emergency.responder.name : emergency.customer.name}</h3>
      <div className={styles.scroller}>
        <ol className={chatStyles.messages} aria-label="Messages">
          {count === 0 && <li className={chatStyles.empty}>No messages yet. Say where exactly you are, or ask a question.</li>}
          {emergency.messages.map((message) => (
            <ChatMessage key={message.id} message={message} mine={message.senderId === side} />
          ))}
        </ol>
        <div ref={endRef} />
      </div>
      <MessageComposer requestId={`emergency-${emergency.id}-${side}`} onSend={(message) => service.sendMessage(emergency.id, message)} />
    </section>
  )
}
