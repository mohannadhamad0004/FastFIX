import AccountSummary from '../AccountSummary.jsx'
import StepSection from './StepSection.jsx'

// Last step for mechanics, parts shops and tow companies: check everything, then submit.
export default function ReviewStep({ role, form }) {
  return (
    <StepSection
      title="Review and submit"
      intro="Check your details below. Use Back, or click a finished step above, to change anything. After you submit, an admin reviews your documents before you can use your dashboard."
    >
      <AccountSummary account={{ ...form, role }} />
    </StepSection>
  )
}
