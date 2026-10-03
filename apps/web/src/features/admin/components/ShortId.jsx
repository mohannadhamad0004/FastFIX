import { useToast } from '../../../components/Toast/ToastContext.js'
import styles from './ShortId.module.css'

// An id shortened to its first 8 characters with a copy button (the full id is the tooltip). Pass
// `full` where the whole id belongs, e.g. on a details page.
export default function ShortId({ id, full = false }) {
  const toast = useToast()

  async function copy(event) {
    event.stopPropagation()
    try {
      await navigator.clipboard.writeText(id)
      toast.success('ID copied.')
    } catch {
      toast.error("Couldn't copy the ID.")
    }
  }

  return (
    <span className={styles.id}>
      <code className={styles.code} title={full ? undefined : id}>
        {full ? id : id.slice(0, 8)}
      </code>
      <button type="button" className={styles.copy} onClick={copy} aria-label={`Copy ID ${id}`}>
        Copy
      </button>
    </span>
  )
}
