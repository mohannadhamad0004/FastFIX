import Button from '../../../components/Button.jsx'
import Notice from '../../../components/Notice.jsx'
import styles from './RequestFormShell.module.css'

// Layout shared by the request forms: the fields, a form-level error, and Cancel / Send.
export default function RequestFormShell({ onSubmit, onCancel, submitting, formError, submitLabel, children }) {
  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {children}
      {formError && <Notice tone="danger">{formError}</Notice>}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitting ? 'Sending…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

// Fields side by side on wide screens, stacked on phones.
export function FieldRow({ children }) {
  return <div className={styles.row}>{children}</div>
}
