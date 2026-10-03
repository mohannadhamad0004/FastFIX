import Badge from '../../../components/Badge.jsx'
import styles from './ModelChoice.module.css'

// The first question in "View on my car in 3D": where the car model comes from.
// onChoose('ready' | 'scan').
export default function ModelChoice({ onChoose }) {
  return (
    <section className={styles.choice} aria-labelledby="model-choice-title">
      <h3 id="model-choice-title" className={styles.title}>
        How should we get your car&apos;s 3D model?
      </h3>
      <div className={styles.options}>
        <button type="button" className={`${styles.option} ${styles.recommended}`} onClick={() => onChoose('ready')}>
          <span className={styles.optionHeader}>
            <span className={styles.optionTitle}>Use a ready model</span>
            <Badge tone="success">Recommended</Badge>
          </span>
          <span className={styles.text}>
            Pick your make, model and year. If we have a 3D model for it, it opens right away, and parts snap into place:
            new wheels and lights replace the originals.
          </span>
        </button>
        <button type="button" className={styles.option} onClick={() => onChoose('scan')}>
          <span className={styles.optionHeader}>
            <span className={styles.optionTitle}>Scan my own car</span>
            <Badge tone="info">Beta</Badge>
          </span>
          <span className={styles.text}>
            Take photos all around your car (or a 360° video). Building the model takes a few minutes, and on a scanned car you place
            accessories by hand.
          </span>
        </button>
      </div>
    </section>
  )
}
