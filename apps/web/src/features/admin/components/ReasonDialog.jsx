import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import { TextField } from '../../../components/FormField.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import styles from './ReasonDialog.module.css'

// Asks the admin for a reason before a moderation action (reject an account, hide a part,
// suspend a user). onConfirm(reason) returns a Promise; its error is shown in the dialog.
export default function ReasonDialog({
  open,
  title,
  label = 'Reason',
  hint,
  required = true,
  requiredMessage = 'Write the reason.',
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <ReasonForm
        label={label}
        hint={hint}
        required={required}
        requiredMessage={requiredMessage}
        confirmLabel={confirmLabel}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </Modal>
  )
}

function ReasonForm({ label, hint, required, requiredMessage, confirmLabel, onCancel, onConfirm }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (required && !reason.trim()) {
      setError(requiredMessage)
      return
    }
    setSaving(true)
    try {
      await onConfirm(reason.trim())
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {formError && <Notice tone="danger">{formError}</Notice>}
      <TextField
        id="reason"
        as="textarea"
        label={label}
        optional={!required}
        hint={hint}
        rows={4}
        autoFocus
        value={reason}
        onChange={(event) => {
          setReason(event.target.value)
          setError(null)
        }}
        error={error}
      />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" loading={saving}>
          {saving ? 'Saving…' : confirmLabel}
        </Button>
      </div>
    </form>
  )
}
