import { ROLES } from '../../authorization/roles.js'
import Button from '../../components/Button.jsx'
import { TextField } from '../../components/FormField.jsx'
import Notice from '../../components/Notice.jsx'
import { useToast } from '../../components/Toast/ToastContext.js'
import { useSaveForm } from '../../hooks/useSaveForm.js'
import { useAuth, useProfileService } from '../useAuth.js'
import { isValidEmail, isValidPhone } from '../validation.js'
import styles from './AccountForms.module.css'

function validate(values, role) {
  const errors = {}
  if (!values.email.trim()) errors.email = 'Enter your email address.'
  else if (!isValidEmail(values.email)) errors.email = 'Enter a valid email address, like name@example.com.'
  if (!values.phone.trim()) {
    if (role !== ROLES.ADMIN) errors.phone = 'Enter your phone number.'
  } else if (!isValidPhone(values.phone)) {
    errors.phone = 'Enter a valid phone number (9 to 15 digits).'
  }
  return errors
}

// Email (also the login) and phone. Private: never shown on public pages.
export default function ContactForm() {
  const { user } = useAuth()
  const service = useProfileService()
  const toast = useToast()
  const form = useSaveForm({ email: user.email, phone: user.phone ?? '' })
  const { values } = form

  const changed = values.email.trim().toLowerCase() !== user.email || values.phone.trim() !== (user.phone ?? '')

  async function handleSubmit(event) {
    event.preventDefault()
    const saved = await form.submit({
      validate: (current) => validate(current, user.role),
      save: (current) => service.updateContact(current),
    })
    if (saved) {
      form.setValues({ email: saved.email, phone: saved.phone })
      toast.success('Your contact details were saved.')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.grid}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          hint="You log in with this email."
          {...form.bind('email')}
        />
        <TextField
          label="Phone"
          type="tel"
          autoComplete="tel"
          optional={user.role === ROLES.ADMIN}
          hint="9 to 15 digits. You can start with + and the country code."
          {...form.bind('phone')}
        />
      </div>
      {form.formError && <Notice tone="danger">{form.formError}</Notice>}
      <div className={styles.actions}>
        <Button type="submit" variant="secondary" loading={form.saving} disabled={!changed}>
          {form.saving ? 'Saving…' : 'Save contact details'}
        </Button>
      </div>
    </form>
  )
}
