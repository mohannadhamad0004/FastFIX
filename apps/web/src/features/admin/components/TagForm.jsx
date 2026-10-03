import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import { FieldError, TextField } from '../../../components/FormField.jsx'
import { tagColor } from '../../../utils/tagColors.js'
import { AdminError } from '../adminService.js'
import { TAG_COLORS, TAG_NAME_MAX_LENGTH } from '../constants.js'
import styles from './TagForm.module.css'

// Name + color for a new tag or a rename. onSubmit({ name, color }) returns a Promise; field
// errors from the service (duplicate name, ...) appear under the matching field.
export default function TagForm({ idPrefix, initialName = '', initialColor = TAG_COLORS[0].value, submitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState(initialName)
  const [color, setColor] = useState(initialColor)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (!name.trim()) {
      setErrors({ name: 'Give the tag a name.' })
      document.getElementById(`${idPrefix}-name`)?.focus()
      return
    }
    setSaving(true)
    try {
      await onSubmit({ name, color })
      if (!onCancel) {
        setName('')
        setErrors({})
      }
    } catch (err) {
      setErrors(err instanceof AdminError && err.field ? { [err.field]: err.message } : { form: err.message })
    } finally {
      setSaving(false)
    }
  }

  const preview = name.trim() || 'Tag name'

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        id={`${idPrefix}-name`}
        label="Name"
        maxLength={TAG_NAME_MAX_LENGTH}
        value={name}
        onChange={(event) => {
          setName(event.target.value)
          setErrors({})
        }}
        error={errors.name}
        className={styles.name}
      />
      <fieldset className={styles.colors}>
        <legend className={styles.legend}>Color</legend>
        <div className={styles.swatches}>
          {TAG_COLORS.map((option) => (
            <label key={option.value} className={styles.swatchLabel} title={option.label}>
              <input
                type="radio"
                name={`${idPrefix}-color`}
                value={option.value}
                checked={color === option.value}
                onChange={() => setColor(option.value)}
                className={styles.radio}
              />
              <span className={styles.swatch} style={{ backgroundColor: tagColor(option.value) }} />
              <span className={styles.srOnly}>{option.label}</span>
            </label>
          ))}
        </div>
        <FieldError id={`${idPrefix}-color-error`}>{errors.color}</FieldError>
      </fieldset>
      <div className={styles.footer}>
        <span className={styles.preview} style={{ backgroundColor: tagColor(color) }} aria-hidden="true">
          {preview}
        </span>
        <div className={styles.buttons}>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={saving}>
            {saving ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
      <FieldError id={`${idPrefix}-form-error`}>{errors.form}</FieldError>
    </form>
  )
}
