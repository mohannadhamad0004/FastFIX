import Button from '../../components/Button.jsx'
import { TextField } from '../../components/FormField.jsx'
import Notice from '../../components/Notice.jsx'
import { useToast } from '../../components/Toast/ToastContext.js'
import { useSaveForm } from '../../hooks/useSaveForm.js'
import PasswordInput from '../PasswordInput.jsx'
import PasswordStrength from '../PasswordStrength.jsx'
import { useProfileService } from '../useAuth.js'
import { passwordError } from '../validation.js'
import styles from './AccountForms.module.css'

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' }

// Same rules as signup and reset (validation.js).
function validate({ currentPassword, newPassword, confirmPassword }) {
  const errors = {}
  if (!currentPassword) errors.currentPassword = 'Enter your current password.'
  const badPassword = passwordError(newPassword)
  if (badPassword) errors.newPassword = badPassword
  else if (newPassword === currentPassword) {
    errors.newPassword = 'Choose a new password that is different from your current one.'
  }
  if (!confirmPassword) errors.confirmPassword = 'Type your new password again.'
  else if (confirmPassword !== newPassword) errors.confirmPassword = "Passwords don't match."
  return errors
}

// Current password, new password with the strength meter, and confirmation.
export default function ChangePasswordForm() {
  const service = useProfileService()
  const toast = useToast()
  const form = useSaveForm(EMPTY)

  async function handleSubmit(event) {
    event.preventDefault()
    const saved = await form.submit({ validate, save: (values) => service.changePassword(values) })
    if (saved) {
      form.setValues(EMPTY)
      toast.success('Your password was changed. Use the new one next time you log in.')
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.narrow}>
        <TextField
          as={PasswordInput}
          label="Current password"
          autoComplete="current-password"
          {...form.bind('currentPassword')}
        />
        <TextField as={PasswordInput} label="New password" autoComplete="new-password" {...form.bind('newPassword')} />
        <PasswordStrength password={form.values.newPassword} />
        <TextField
          as={PasswordInput}
          label="Confirm new password"
          autoComplete="new-password"
          {...form.bind('confirmPassword')}
        />
      </div>
      {form.formError && <Notice tone="danger">{form.formError}</Notice>}
      <div className={styles.actions}>
        <Button type="submit" variant="secondary" loading={form.saving}>
          {form.saving ? 'Saving…' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}
