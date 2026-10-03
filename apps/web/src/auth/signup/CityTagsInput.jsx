import { useState } from 'react'
import Button from '../../components/Button.jsx'
import { FieldError } from '../../components/FormField.jsx'
import styles from './CityTagsInput.module.css'

// Type a city and press Enter (or Add) to add it to the list. Each city can be removed again.
export default function CityTagsInput({ id, label, hint, value, onChange, error }) {
  const [draft, setDraft] = useState('')

  function addCity() {
    const city = draft.trim()
    if (!city) return
    if (!value.some((existing) => existing.toLowerCase() === city.toLowerCase())) onChange([...value, city])
    setDraft('')
  }

  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      <div className={styles.row}>
        <input
          id={id}
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault() // don't submit the form
              addCity()
            }
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          autoComplete="off"
        />
        <Button variant="secondary" onClick={addCity}>
          Add
        </Button>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
      {value.length > 0 && (
        <ul className={styles.tags} aria-label={`${label}: added`}>
          {value.map((city) => (
            <li key={city} className={styles.tag}>
              {city}
              <button
                type="button"
                className={styles.remove}
                onClick={() => onChange(value.filter((c) => c !== city))}
                aria-label={`Remove ${city}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
