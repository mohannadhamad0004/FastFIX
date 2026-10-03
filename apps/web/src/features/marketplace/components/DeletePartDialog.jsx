import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import { useMarketplaceService } from '../MarketplaceContext.js'
import styles from './DeletePartDialog.module.css'

// "Delete this part?" confirmation. The service rejects parts from another shop.
// Open while `part` is set: <DeletePartDialog part={partOrNull} onDeleted={...} onCancel={...} />
export default function DeletePartDialog({ part, onDeleted, onCancel }) {
  return (
    <Modal open={Boolean(part)} title="Delete this part?" onClose={onCancel}>
      {part && <DeleteConfirm part={part} onDeleted={onDeleted} onCancel={onCancel} />}
    </Modal>
  )
}

function DeleteConfirm({ part, onDeleted, onCancel }) {
  const service = useMarketplaceService()
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await service.deletePart(part.id)
      onDeleted(part)
    } catch (err) {
      setError(err.message || "Couldn't delete the part. Please try again.")
      setDeleting(false)
    }
  }

  return (
    <div className={styles.body}>
      <p>
        “{part.name}” ({part.oemNumber}) will be removed from the marketplace. This can't be undone.
      </p>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={deleting}>
          {deleting ? 'Deleting…' : 'Delete part'}
        </Button>
      </div>
    </div>
  )
}
