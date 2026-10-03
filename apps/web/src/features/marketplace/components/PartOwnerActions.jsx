import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import { useAuth } from '../../../auth/useAuth.js'
import { canManagePart } from '../ownership.js'
import DeletePartDialog from './DeletePartDialog.jsx'
import styles from './PartOwnerActions.module.css'

// Edit and Delete for a part card. Renders nothing unless the logged-in user is the parts shop
// that owns this part, so other shops (and everyone else) never see these buttons.
export default function PartOwnerActions({ part }) {
  const { user } = useAuth()
  const [confirming, setConfirming] = useState(false)

  if (!canManagePart(user, part)) return null

  return (
    <div className={styles.actions}>
      <span className={styles.label}>Your part</span>
      <Button variant="secondary" to={`/parts-shop?edit=${encodeURIComponent(part.id)}`}>
        Edit
      </Button>
      <Button variant="secondary" onClick={() => setConfirming(true)}>
        Delete
      </Button>
      <DeletePartDialog
        part={confirming ? part : null}
        onDeleted={() => setConfirming(false)}
        onCancel={() => setConfirming(false)}
      />
    </div>
  )
}
