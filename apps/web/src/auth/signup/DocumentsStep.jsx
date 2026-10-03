import FileUpload from '../../components/FileUpload.jsx'
import { ROLES } from '../../authorization/roles.js'
import StepSection from './StepSection.jsx'

// Step 3 for parts shops and tow companies: the business license (required).
// Parts shops can add other documents too.
export default function DocumentsStep({ role, form, setField, errors }) {
  const isShop = role === ROLES.PARTS_SHOP

  return (
    <StepSection
      title={isShop ? 'Shop documents' : 'Company documents'}
      intro="An admin checks these before your account goes live. Make sure every page is readable."
    >
      <FileUpload
        id="businessLicense"
        label={isShop ? 'Business license or commercial registration' : 'Business license'}
        kind="document"
        value={form.businessLicense}
        onChange={(file) => setField('businessLicense', file)}
        error={errors.businessLicense}
      />
      {isShop && (
        <FileUpload
          id="extraDocuments"
          label="Other documents"
          hint="For example a tax certificate or a distributor agreement."
          optional
          kind="document"
          multiple
          value={form.extraDocuments}
          onChange={(files) => setField('extraDocuments', files)}
          error={errors.extraDocuments}
        />
      )}
    </StepSection>
  )
}
