import { useId } from 'react'
import Badge from '../../../components/Badge.jsx'
import { FieldError } from '../../../components/FormField.jsx'
import { hasRating } from '../ratings.js'
import styles from './Stars.module.css'

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

/** Read-only stars for a 0-5 value (rounded to the nearest half star). */
export function StarRating({ value, size = 'sm' }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className={`${styles.stars} ${styles[size]}`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          aria-hidden="true"
          className={star <= rounded ? styles.full : star - 0.5 === rounded ? styles.half : styles.empty}
        >
          ★
        </span>
      ))}
    </span>
  )
}

/**
 * "★ 4.6 (12 reviews)", or a "New" badge instead of stars while there are fewer than 3 reviews
 * (or no `summary` at all).
 * @param {{ summary?: { average: number, count: number }, compact?: boolean }} props
 */
export function RatingSummary({ summary, compact = false }) {
  if (!hasRating(summary)) return <Badge tone="info">New</Badge>
  return (
    <span className={styles.summary}>
      <StarRating value={summary.average} />
      <span className={styles.average}>{summary.average.toFixed(1)}</span>
      <span className={styles.count}>
        ({summary.count}
        {compact ? '' : summary.count === 1 ? ' review' : ' reviews'})
      </span>
    </span>
  )
}

/**
 * 1-5 star picker: radio buttons drawn as stars (arrow keys move between them).
 * @param {{ id: string, value: number, onChange: (stars: number) => void, error?: string, label?: string }} props
 */
export function StarInput({ id, value, onChange, error, label = 'Your rating' }) {
  const name = useId()
  return (
    <fieldset id={id} tabIndex={-1} className={styles.input} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={styles.legend}>{label}</legend>
      <div className={styles.choices}>
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className={`${styles.choice} ${star <= value ? styles.on : ''}`}>
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className={styles.radio}
            />
            <span aria-hidden="true">★</span>
            <span className={styles.srOnly}>
              {star} {star === 1 ? 'star' : 'stars'} - {STAR_LABELS[star]}
            </span>
          </label>
        ))}
        <span className={styles.chosen} aria-hidden="true">
          {STAR_LABELS[value]}
        </span>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </fieldset>
  )
}
