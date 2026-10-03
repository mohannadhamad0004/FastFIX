import FileUpload from '../../components/FileUpload.jsx'
import { TextField } from '../../components/FormField.jsx'
import { ROLES } from '../../authorization/roles.js'
import CityTagsInput from './CityTagsInput.jsx'
import { DESCRIPTION_MAX_LENGTH } from './constants.js'
import StepSection from './StepSection.jsx'
import { textFieldProps } from './textFieldProps.js'

// Step 2 for parts shops and tow companies: logo, city and address.
// Both add a short description (optional for tow companies); tow companies also list the cities
// they cover.
export default function CompanyProfileStep({ role, ...stepProps }) {
  const { form, setField, errors } = stepProps
  const isShop = role === ROLES.PARTS_SHOP

  return (
    <StepSection
      title={isShop ? 'Your shop' : 'Your company'}
      intro={isShop ? 'Customers see this on your shop page.' : 'Customers see this when you take their tow request.'}
    >
      <FileUpload
        id="profilePhoto"
        label={isShop ? 'Shop logo or profile photo' : 'Company logo'}
        kind="image"
        value={form.profilePhoto}
        onChange={(file) => setField('profilePhoto', file)}
        error={errors.profilePhoto}
      />
      <TextField label="City" autoComplete="address-level2" {...textFieldProps('city', stepProps)} />
      <TextField label="Address" autoComplete="street-address" {...textFieldProps('address', stepProps)} />

      <TextField
        as="textarea"
        label="Short description"
        optional={!isShop}
        hint={`${isShop ? 'What you sell and what makes your shop worth visiting.' : 'Shown on your public profile, e.g. your hours and the vehicles you can tow.'} ${form.description.length}/${DESCRIPTION_MAX_LENGTH} characters.`}
        maxLength={DESCRIPTION_MAX_LENGTH}
        rows={4}
        {...textFieldProps('description', stepProps)}
      />

      {role === ROLES.TOW && (
        <CityTagsInput
          id="serviceArea"
          label="Service area"
          hint="Cities you cover. Type a city and press Enter or Add."
          value={form.serviceArea}
          onChange={(cities) => setField('serviceArea', cities)}
          error={errors.serviceArea}
        />
      )}
    </StepSection>
  )
}
