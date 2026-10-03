import styles from './FilterChips.module.css'

// Active filters as removable chips. Each chip's `changes` removes that filter.
export default function FilterChips({ chips, onRemove, onClearAll }) {
  if (chips.length === 0) return null

  return (
    <div className={styles.chips}>
      <ul className={styles.list}>
        {chips.map((chip) => (
          <li key={chip.key} className={styles.chip}>
            <span>{chip.label}</span>
            <button
              type="button"
              className={styles.remove}
              aria-label={`Remove filter ${chip.label}`}
              onClick={() => onRemove(chip.changes)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button type="button" className={styles.clearAll} onClick={onClearAll}>
        Clear all filters
      </button>
    </div>
  )
}
