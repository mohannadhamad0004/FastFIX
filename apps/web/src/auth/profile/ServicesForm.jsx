import Button from '../../components/Button.jsx'
import { FieldError } from '../../components/FormField.jsx'
import Notice from '../../components/Notice.jsx'
import { useToast } from '../../components/Toast/ToastContext.js'
import { useSaveForm } from '../../hooks/useSaveForm.js'
import { serviceModeErrors } from '../profileRules.js'
import CityTagsInput from '../signup/CityTagsInput.jsx'
import { SERVICE_MODES } from '../signup/constants.js'
import { useAuth, useProfileService } from '../useAuth.js'
import formStyles from './ProfileForms.module.css'
import styles from './ServicesForm.module.css'

// Mechanics: "Services I offer" - on-site (with the cities covered), workshop visit, online
// consultation, plus the car makes they specialize in. Customers pick a service mode when they
// request service and can filter mechanics by make. Not reviewed.
export default function ServicesForm() {
  const { user } = useAuth()
  const service = useProfileService()
  const toast = useToast()
  const form = useSaveForm({
    serviceModes: user.serviceModes ?? [],
    onSiteCities: user.onSiteCities ?? [],
    makes: user.makes ?? [],
  })
  const { values, setValue, errors } = form

  function toggle(mode, checked) {
    const next = checked ? [...values.serviceModes, mode] : values.serviceModes.filter((m) => m !== mode)
    // Keep SERVICE_MODES order, so badges always appear in the same order.
    setValue(
      'serviceModes',
      SERVICE_MODES.map((m) => m.value).filter((m) => next.includes(m)),
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const result = await form.submit({
      validate: serviceModeErrors,
      save: (current) => service.updateProfile(current),
    })
    if (result) toast.success('Your services were saved. Customers see them on your profile.')
  }

  const offersOnSite = values.serviceModes.includes('on_site')

  return (
    <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
      <fieldset
        id="serviceModes"
        tabIndex={-1}
        className={styles.modes}
        aria-describedby={errors.serviceModes ? 'serviceModes-error' : undefined}
      >
        <legend className={styles.legend}>Services I offer</legend>
        {SERVICE_MODES.map((mode) => (
          <label key={mode.value} className={styles.mode}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={values.serviceModes.includes(mode.value)}
              onChange={(event) => toggle(mode.value, event.target.checked)}
            />
            <span className={styles.text}>
              <span className={styles.label}>{mode.label}</span>
              <span className={styles.hint}>{mode.description}</span>
            </span>
          </label>
        ))}
        <FieldError id="serviceModes-error">{errors.serviceModes}</FieldError>
      </fieldset>

      {offersOnSite && (
        <CityTagsInput
          id="onSiteCities"
          label="Cities you drive to (on-site)"
          hint="Type a city and press Enter or Add."
          value={values.onSiteCities}
          onChange={(cities) => setValue('onSiteCities', cities)}
          error={errors.onSiteCities}
        />
      )}

      <CityTagsInput
        id="makes"
        label="Car makes you specialize in"
        hint="Optional. Customers can filter mechanics by make. Type a make, e.g. Toyota, and press Enter or Add."
        value={values.makes}
        onChange={(makes) => setValue('makes', makes)}
      />

      {form.formError && <Notice tone="danger">{form.formError}</Notice>}
      <div className={formStyles.actions}>
        <Button type="submit" variant="secondary" loading={form.saving}>
          {form.saving ? 'Saving…' : 'Save services'}
        </Button>
      </div>
    </form>
  )
}
