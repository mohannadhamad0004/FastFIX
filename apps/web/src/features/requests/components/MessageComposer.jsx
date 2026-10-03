import { useRef, useState } from 'react'
import Button from '../../../components/Button.jsx'
import { FieldError } from '../../../components/FormField.jsx'
import FilePreview from '../../../components/FilePreview.jsx'
import { FILE_KINDS, validateFile } from '../../../utils/files.js'
import { useChatService } from '../ChatsContext.js'
import { MAX_PHOTOS_PER_MESSAGE, MESSAGE_MAX_LENGTH } from '../chatService.js'
import styles from './MessageComposer.module.css'

// Write a message and/or attach photos, then Send. Enter sends, Shift+Enter starts a new line.
// `onSend({ text, photos })` replaces the chat service (the emergency screen has its own messages).
export default function MessageComposer({ requestId, onSend = null }) {
  const service = useChatService()
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const fileRef = useRef(null)
  const textId = `composer-${requestId}`

  function addPhotos(fileList) {
    const incoming = Array.from(fileList)
    const problem = incoming.map((file) => validateFile(file, 'image')).find(Boolean)
    const valid = incoming.filter((file) => !validateFile(file, 'image'))
    const next = [...photos, ...valid].slice(0, MAX_PHOTOS_PER_MESSAGE)
    setPhotos(next)
    setError(
      problem ??
        (photos.length + valid.length > MAX_PHOTOS_PER_MESSAGE
          ? `Send up to ${MAX_PHOTOS_PER_MESSAGE} photos at a time.`
          : null),
    )
  }

  async function send(event) {
    event?.preventDefault()
    if (!text.trim() && photos.length === 0) {
      setError('Write a message or add a photo.')
      return
    }
    setSending(true)
    setError(null)
    try {
      await (onSend ? onSend({ text, photos }) : service.sendMessage(requestId, { text, photos }))
      setText('')
      setPhotos([])
      document.getElementById(textId)?.focus()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <form className={styles.composer} onSubmit={send} noValidate>
      {photos.length > 0 && (
        <ul className={styles.previews} aria-label="Photos to send">
          {photos.map((photo, index) => (
            <li key={`${photo.name}-${photo.size}-${photo.lastModified}`}>
              <FilePreview file={photo} onRemove={() => setPhotos(photos.filter((_, i) => i !== index))} />
            </li>
          ))}
        </ul>
      )}
      <div className={styles.row}>
        <input
          ref={fileRef}
          type="file"
          accept={FILE_KINDS.image.accept}
          multiple
          className={styles.fileInput}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            addPhotos(event.target.files)
            event.target.value = ''
          }}
        />
        <Button
          variant="secondary"
          className={styles.attach}
          onClick={() => fileRef.current?.click()}
          aria-label="Add photos"
          title="Add photos (JPG or PNG)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </Button>
        <label htmlFor={textId} className={styles.srOnly}>
          Message
        </label>
        <textarea
          id={textId}
          className={styles.input}
          rows={1}
          placeholder="Write a message…"
          maxLength={MESSAGE_MAX_LENGTH}
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${textId}-error` : undefined}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              send()
            }
          }}
        />
        <Button type="submit" loading={sending}>
          Send
        </Button>
      </div>
      <FieldError id={`${textId}-error`}>{error}</FieldError>
    </form>
  )
}
