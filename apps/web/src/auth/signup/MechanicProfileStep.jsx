import FileUpload from '../../components/FileUpload.jsx'
import { TextField } from '../../components/FormField.jsx'
import StepSection from './StepSection.jsx'
import { textFieldProps } from './textFieldProps.js'

// Mechanic step 2: profile photo, city, and the workshop they work at.
export default function MechanicProfileStep(stepProps) {
  const { form, setField, errors } = stepProps

  return (
    <StepSection title="You and your workshop" intro="Customers see this on your profile.">
      <FileUpload
        id="profilePhoto"
        label="Profile photo"
        hint="A clear photo of your face."
        kind="image"
        value={form.profilePhoto}
        onChange={(file) => setField('profilePhoto', file)}
        error={errors.profilePhoto}
      />
      <TextField label="City" autoComplete="address-level2" {...textFieldProps('city', stepProps)} />
      <TextField label="Workshop name" autoComplete="organization" {...textFieldProps('workshopName', stepProps)} />
      <TextField label="Workshop address" autoComplete="street-address" {...textFieldProps('address', stepProps)} />
    </StepSection>
  )
}
