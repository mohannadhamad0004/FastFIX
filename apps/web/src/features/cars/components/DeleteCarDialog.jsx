import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import { useCarsService } from '../CarsContext.js'
import { carLabel } from '../format.js'
import styles from './DeleteCarDialog.module.css'

// "Delete this car?" confirmation. onDeleted() runs after it is gone.
export default function DeleteCarDialog({ car, onCancel, onDeleted }) {
  const service = useCarsService()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await service.deleteCar(car.id)
      onDeleted()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal open={Boolean(car)} title="Delete this car?" onClose={onCancel}>
      {car && (
        <div className={styles.dialog}>
          <p>
            <strong>{carLabel(car)}</strong> will be removed from My Cars. Your past requests and reports for it stay
            in Reports.
          </p>
          {error && <Notice tone="danger">{error}</Notice>}
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirm} loading={busy}>
              {busy ? 'Deleting…' : 'Delete car'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
