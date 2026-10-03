import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { loginPathFor } from '../../../auth/redirect.js'
import { useAuth } from '../../../auth/useAuth.js'
import { usePermission } from '../../../authorization/usePermission.js'
import Button from '../../../components/Button.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import { REQUEST_PERMISSIONS, REQUEST_SENT_MESSAGE } from '../constants.js'
import styles from './RequestAction.module.css'

// A request button plus its form in a modal.
//   logged out            -> the button is shown; clicking it goes to /login?redirect=<this page>
//   role can't send `type` -> nothing is rendered (e.g. parts shops, or mechanics for service/tow)
//   allowed               -> opens the form; after sending, shows the success message
// renderForm({ onSent, onCancel }) returns the form element.
export default function RequestAction({ type, label, title, renderForm, className = '', variant = 'primary' }) {
  const { user } = useAuth()
  const allowed = usePermission(REQUEST_PERMISSIONS[type])
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  // The request just sent, for the "Open chat" link
  const [sent, setSent] = useState(null)

  if (user && !allowed) return null

  function handleClick() {
    if (!user) {
      navigate(loginPathFor(location))
      return
    }
    setSent(null)
    setOpen(true)
  }

  const close = () => setOpen(false)

  return (
    <>
      <Button variant={variant} className={className} onClick={handleClick}>
        {label}
      </Button>
      <Modal open={open} title={sent ? 'Request sent' : title} onClose={close} wide={!sent}>
        {sent ? (
          <div className={styles.sent}>
            <Notice tone="success">{REQUEST_SENT_MESSAGE}</Notice>
            <div className={styles.done}>
              <Button variant="secondary" onClick={close}>
                Done
              </Button>
              <Button to={`/chats/${sent.id}`}>Open chat</Button>
            </div>
          </div>
        ) : (
          renderForm({ onSent: (request) => setSent(request), onCancel: close })
        )}
      </Modal>
    </>
  )
}
