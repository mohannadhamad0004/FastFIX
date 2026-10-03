import styles from './Skeleton.module.css'

/**
 * Grey shimmering placeholder shown while content loads. Hidden from screen readers: put the
 * loading message on the container instead (SkeletonCards does this).
 * @param {Object} props
 * @param {'text' | 'rect' | 'circle'} [props.variant]
 * @param {string | number} [props.width]
 * @param {string | number} [props.height]
 */
export default function Skeleton({ variant = 'text', width, height, className = '' }) {
  return (
    <span
      className={[styles.skeleton, styles[variant], className].filter(Boolean).join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

// A few lines of text, the last one shorter.
export function SkeletonText({ lines = 3 }) {
  return (
    <span className={styles.lines} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} />
      ))}
    </span>
  )
}

// Stacked rows, for tables and lists that are loading. `label` is read by screen readers.
export function SkeletonRows({ rows = 5, label = 'Loading…' }) {
  return (
    <div className={styles.rows} role="status" aria-label={label}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} variant="rect" height={44} />
      ))}
    </div>
  )
}

// A grid of placeholder cards for lists that are loading. `label` is read by screen readers.
export function SkeletonCards({ count = 6, label = 'Loading…', media = false }) {
  return (
    <div className={styles.grid} role="status" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={styles.card}>
          {media && <Skeleton variant="rect" height={120} />}
          <div className={styles.cardHeader}>
            {!media && <Skeleton variant="circle" width={48} height={48} />}
            <span className={styles.lines}>
              <Skeleton width="70%" />
              <Skeleton width="45%" />
            </span>
          </div>
          <SkeletonText lines={2} />
        </div>
      ))}
    </div>
  )
}
