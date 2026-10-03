import FileUpload from '../../components/FileUpload.jsx'
import { TextField } from '../../components/FormField.jsx'
import { ROLES } from '../../authorization/roles.js'
import { COMPANY_ROLES } from '../constants.js'
import PasswordInput from '../PasswordInput.jsx'
import PasswordStrength from '../PasswordStrength.jsx'
import StepSection from './StepSection.jsx'
import { textFieldProps } from './textFieldProps.js'

// Step 1 for every role: name, contact details and password.
// Customers can also add an optional profile photo here - it is their only step.
export default function AccountStep({ role, ...stepProps }) {
  const { form, setField, errors } = stepProps
  const isCompany = COMPANY_ROLES.includes(role)

  return (
    <StepSection title="Account info" intro="You'll use your email and password to log in.">
      <TextField
        label={isCompany ? 'Company name' : 'Full name'}
        autoComplete={isCompany ? 'organization' : 'name'}
        {...textFieldProps('name', stepProps)}
      />
      <TextField label="Email" type="email" autoComplete="email" {...textFieldProps('email', stepProps)} />
      <TextField
        label="Phone"
        type="tel"
        autoComplete="tel"
        hint="9 to 15 digits. You can start with + and the country code."
        {...textFieldProps('phone', stepProps)}
      />
      <TextField
        as={PasswordInput}
        label="Password"
        autoComplete="new-password"
        {...textFieldProps('password', stepProps)}
      />
      <PasswordStrength password={form.password} />
      <TextField
        as={PasswordInput}
        label="Confirm password"
        autoComplete="new-password"
        {...textFieldProps('confirmPassword', stepProps)}
      />
      {role === ROLES.CUSTOMER && (
        <FileUpload
          id="profilePhoto"
          label="Profile photo"
          optional
          kind="image"
          value={form.profilePhoto}
          onChange={(file) => setField('profilePhoto', file)}
          error={errors.profilePhoto}
        />
      )}
    </StepSection>
  )
}
