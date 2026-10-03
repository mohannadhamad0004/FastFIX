import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { loginPathFor } from '../../../auth/redirect.js'
import { useAuth } from '../../../auth/useAuth.js'
import { usePermission } from '../../../authorization/usePermission.js'
import Button from '../../../components/Button.jsx'
import { TextField } from '../../../components/FormField.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import { useMarketplaceQuery } from '../../marketplace/MarketplaceContext.js'
import { REQUEST_PERMISSIONS, REQUEST_TYPES } from '../../requests/constants.js'
import { useRequestsService } from '../../requests/RequestsContext.js'
import { formatPreviewCar } from '../fitment.js'
import styles from './AskShopsButton.module.css'

const MESSAGE_MAX_LENGTH = 500
const loadShops = (service) => service.getShops()

// "Ask the shop about these parts": one question per shop for the parts in the 3D preview, so each
// shop gets its own chat (a part question request, features/requests). Customers and mechanics;
// visitors are sent to log in first; other roles don't see it.
export default function AskShopsButton({ parts, car, onSent }) {
  const { user } = useAuth()
  const allowed = usePermission(REQUEST_PERMISSIONS[REQUEST_TYPES.PART_QUESTION])
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (user && !allowed) return null

  return (
    <>
      <Button
        variant="secondary"
        disabled={parts.length === 0}
        onClick={() => (user ? setOpen(true) : navigate(loginPathFor(location)))}
      >
        Ask the shop about these parts
      </Button>
      <Modal open={open} title="Ask the shops about these parts" onClose={() => setOpen(false)} wide>
        {open && <AskShopsForm parts={parts} car={car} onSent={onSent} onClose={() => setOpen(false)} />}
      </Modal>
    </>
  )
}

function AskShopsForm({ parts, car, onSent, onClose }) {
  const requests = useRequestsService()
  const { data: shops } = useMarketplaceQuery(loadShops)
  const byShop = new Map()
  for (const part of parts) {
    if (!byShop.has(part.shopId)) byShop.set(part.shopId, { shopId: part.shopId, parts: [] })
    byShop.get(part.shopId).parts.push(part)
  }
  const groups = [...byShop.values()]
  const carText = car ? ` for my ${formatPreviewCar(car)}` : ''
  const [messages, setMessages] = useState(() =>
    Object.fromEntries(
      groups.map((g) => [
        g.shopId,
        `Hi, I tried these parts on my car in the 3D preview${carText}: ${g.parts.map((p) => p.name).join(', ')}. Are they in stock, and do they fit?`,
      ]),
    ),
  )
  const [sent, setSent] = useState({}) // shopId -> request id
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(null)

  async function send(group) {
    const message = (messages[group.shopId] ?? '').trim()
    if (!message) {
      setErrors((current) => ({ ...current, [group.shopId]: 'Write your message to the shop.' }))
      return
    }
    setSending(group.shopId)
    try {
      // A part question is about one part; the message lists the others.
      const request = await requests.createRequest(REQUEST_TYPES.PART_QUESTION, group.shopId, {
        partId: group.parts[0].id,
        message: message.slice(0, MESSAGE_MAX_LENGTH),
        quantity: 1,
      })
      setSent((current) => ({ ...current, [group.shopId]: request.id }))
      onSent?.()
    } catch (error) {
      setErrors((current) => ({ ...current, [group.shopId]: error.message }))
    } finally {
      setSending(null)
    }
  }

  const shopName = (id) => shops?.find((s) => s.id === id)?.name ?? 'the shop'

  return (
    <div className={styles.form}>
      <p className={styles.muted}>Each shop gets its own chat. You&apos;ll find the answers in Chats (account menu).</p>
      {groups.map((group) => (
        <section key={group.shopId} className={styles.group} aria-labelledby={`ask-${group.shopId}`}>
          <h3 id={`ask-${group.shopId}`} className={styles.shop}>
            {shopName(group.shopId)}
          </h3>
          <ul className={styles.parts}>
            {group.parts.map((part) => (
              <li key={part.id}>{part.name}</li>
            ))}
          </ul>
          {sent[group.shopId] ? (
            <Notice tone="success">
              Sent. <Button to={`/chats/${sent[group.shopId]}`} variant="ghost" size="sm">Open chat</Button>
            </Notice>
          ) : (
            <>
              <TextField
                id={`ask-message-${group.shopId}`}
                as="textarea"
                label="Message"
                rows={3}
                maxLength={MESSAGE_MAX_LENGTH}
                value={messages[group.shopId]}
                onChange={(event) => {
                  setMessages((current) => ({ ...current, [group.shopId]: event.target.value }))
                  setErrors((current) => ({ ...current, [group.shopId]: undefined }))
                }}
                error={errors[group.shopId]}
              />
              <Button loading={sending === group.shopId} onClick={() => send(group)}>
                Send to {shopName(group.shopId)}
              </Button>
            </>
          )}
        </section>
      ))}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  )
}
