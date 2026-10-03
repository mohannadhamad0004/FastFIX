import { useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '../../components/Button.jsx'
import Modal from '../../components/Modal.jsx'
import Notice from '../../components/Notice.jsx'
import { useToast } from '../../components/Toast/ToastContext.js'
import { useProfileService } from '../useAuth.js'
import styles from './LogoutEverywhere.module.css'

// "Log out of all devices", with a confirmation. Ends every session, this one included.
export default function LogoutEverywhere() {
  const service = useProfileService()
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      // Leave the page first (like "Log out" in the account menu), so this protected page doesn't
      // redirect to /login on its way out.
      await navigate('/')
      await service.logoutAllDevices()
      toast.success('You were logged out on all devices. Log in again to continue.')
    } catch (err) {
      setError(err.message || "Couldn't log you out everywhere. Please try again.")
      setBusy(false)
    }
  }

  return (
    <>
      <div className={styles.row}>
        <p className={styles.text}>
          Lost a phone, or logged in on a shared computer? This ends every session of your account, including this
          one.
        </p>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Log out of all devices
        </Button>
      </div>

      <Modal open={open} title="Log out of all devices?" onClose={() => setOpen(false)}>
        <div className={styles.dialog}>
          <p>You'll be logged out everywhere, including here, and any password reset links you requested stop working.</p>
          {error && <Notice tone="danger">{error}</Notice>}
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirm} loading={busy}>
              {busy ? 'Logging out…' : 'Log out everywhere'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
