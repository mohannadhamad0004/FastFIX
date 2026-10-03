import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { ROLE_LABELS, ROLES } from '../../../authorization/roles.js'
import Avatar from '../../../components/Avatar.jsx'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { useChatService, useChatsQuery } from '../ChatsContext.js'
import { REQUEST_STATUS } from '../constants.js'
import { TARGET_PATHS } from '../format.js'
import { ConfirmCompletion, ProviderCompletion } from './CompletionActions.jsx'
import ChatMessage from './ChatMessage.jsx'
import MessageComposer from './MessageComposer.jsx'
import RateExperience from './RateExperience.jsx'
import RequestSummary from './RequestSummary.jsx'
import styles from './Conversation.module.css'

// One chat: who it's with, the request at the top (with "Mark as completed" for the provider; for the
// sender, "Confirm completed" once the provider completed it, then "Rate your experience"), the
// messages and the composer.
// Opening it marks it read.
export default function Conversation({ requestId, backTo }) {
  const service = useChatService()
  const load = useCallback((s) => s.getChat(requestId), [requestId])
  const { data: chat, loading } = useChatsQuery(load)
  const endRef = useRef(null)
  const messageCount = chat?.messages.length ?? 0

  // Mark read when opened and when new messages arrive; scroll to the newest.
  useEffect(() => {
    if (!chat) return
    service.markRead(requestId)
    endRef.current?.scrollIntoView({ block: 'end' })
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- only when the chat or its length changes
  }, [requestId, messageCount, Boolean(chat)])

  if (loading) return <SkeletonRows rows={4} label="Loading the chat…" />
  if (!chat) {
    return (
      <EmptyState
        icon="💬"
        title="Chat not found"
        description="This chat doesn't exist or isn't yours."
        action={<Button to={backTo}>Back to chats</Button>}
      />
    )
  }

  const { request, other, messages, myId, isProvider, trucks } = chat
  const completed = request.status === REQUEST_STATUS.COMPLETED
  const isSender = request.sender.id === myId
  const isCustomerSender = isSender && request.sender.role === ROLES.CUSTOMER
  const otherPath = TARGET_PATHS[other.role]?.(other.id)

  return (
    <section className={styles.conversation} aria-label={`Chat with ${other.name}`}>
      <header className={styles.header}>
        <Button to={backTo} variant="ghost" size="sm" className={styles.back} aria-label="Back to chats">
          ←
        </Button>
        <Avatar file={other.photo} name={other.name} />
        <div className={styles.who}>
          <h2 className={styles.name}>{otherPath ? <Link to={otherPath}>{other.name}</Link> : other.name}</h2>
          <p className={styles.muted}>{ROLE_LABELS[other.role] ?? other.role}</p>
        </div>
        {isProvider && <ProviderCompletion request={request} trucks={trucks} />}
      </header>

      <div className={styles.scroller}>
        <RequestSummary request={request} showReportLink={isCustomerSender} />
        {completed && isSender && (
          <>
            <ConfirmCompletion request={request} />
            <RateExperience request={request} />
          </>
        )}

        <ol className={styles.messages} aria-label="Messages">
          {messages.length === 0 && (
            <li className={styles.empty}>No messages yet. Say hello and add any details about the request.</li>
          )}
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} mine={message.senderId === myId} />
          ))}
        </ol>
        <div ref={endRef} />
      </div>

      <MessageComposer requestId={requestId} />
    </section>
  )
}
