import { usePreview3D } from '../Preview3DContext.js'
import styles from './Preview3DLauncher.module.css'

// Floating "View on my car in 3D" button in the bottom-right corner; shows how many parts are selected.
export default function Preview3DLauncher() {
  const { items, open } = usePreview3D()
  return (
    <button
      type="button"
      className={styles.launcher}
      onClick={open}
      aria-haspopup="dialog"
      aria-label={`View on my car in 3D${items.length ? `, ${items.length} ${items.length === 1 ? 'part' : 'parts'} selected` : ''}`}
    >
      <svg viewBox="0 0 24 24" className={styles.icon} aria-hidden="true">
        <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m3 7 9 5 9-5M12 12v10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      View on my car in 3D
      {items.length > 0 && (
        <span className={styles.count} aria-hidden="true">
          {items.length}
        </span>
      )}
    </button>
  )
}
