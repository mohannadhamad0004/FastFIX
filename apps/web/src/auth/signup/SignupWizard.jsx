import { useState } from 'react'
import Button from '../../components/Button.jsx'
import Notice from '../../components/Notice.jsx'
import { ROLES } from '../../authorization/roles.js'
import { AuthError } from '../authService.js'
import { useAuth } from '../useAuth.js'
import { FILE_FIELDS, SIGNUP_STEPS, initialForm } from './signupSteps.js'
import StepIndicator from './StepIndicator.jsx'
import styles from './SignupWizard.module.css'

// register() takes the plain fields and the top-level uploads separately.
function splitFiles(form) {
  const data = {}
  const files = {}
  for (const [key, value] of Object.entries(form)) {
    if (FILE_FIELDS.includes(key)) files[key] = value
    else data[key] = value
  }
  return { data, files }
}

const hasErrors = (errors) => Object.keys(errors).length > 0

// After the error messages render, move focus to the first invalid field.
function focusFirstError(errors) {
  const [firstId] = Object.keys(errors)
  requestAnimationFrame(() => document.getElementById(firstId)?.focus())
}

// The multi-step signup form for one role. Each step is validated before moving on, and the
// last step creates the account. On success the new user is logged in and SignupPage redirects.
export default function SignupWizard({ role, onChangeRole }) {
  const { service } = useAuth()
  const steps = SIGNUP_STEPS[role]

  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState(() => initialForm(role))
  // Errors appear after the first failed Next, then update live as the user fixes fields.
  const [showErrors, setShowErrors] = useState(false)
  const [serverErrors, setServerErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const errors = { ...(showErrors ? step.validate(form, role) : {}), ...serverErrors }
  const StepComponent = step.Component

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    if (serverErrors[name]) {
      setServerErrors((current) => {
        const next = { ...current }
        delete next[name]
        return next
      })
    }
  }

  function goTo(index) {
    setStepIndex(index)
    setShowErrors(false)
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 })
      document.getElementById('signup-step-title')?.focus({ preventScroll: true })
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = step.validate(form, role)
    if (hasErrors(found)) {
      setShowErrors(true)
      focusFirstError(found)
      return
    }
    if (!isLast) {
      goTo(stepIndex + 1)
      return
    }

    // Check every step again in case something was changed after it was passed.
    const invalidIndex = steps.findIndex((s) => hasErrors(s.validate(form, role)))
    if (invalidIndex !== -1) {
      goTo(invalidIndex)
      setShowErrors(true)
      return
    }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const { data, files } = splitFiles(form)
      await service.register(role, data, files)
      // The new user is now logged in; SignupPage redirects to their landing page.
    } catch (error) {
      if (error instanceof AuthError && error.field) {
        setServerErrors({ [error.field]: error.message })
        goTo(0) // email and password are both on the first step
      } else {
        setSubmitError("Couldn't create your account. Please try again.")
      }
      setSubmitting(false)
    }
  }

  let submitLabel = 'Next'
  if (isLast) submitLabel = role === ROLES.CUSTOMER ? 'Create account' : 'Submit for review'
  if (submitting) submitLabel = 'Creating account…'

  return (
    <form className={styles.wizard} onSubmit={handleSubmit} noValidate>
      {steps.length > 1 && <StepIndicator steps={steps} current={stepIndex} onGoTo={goTo} />}

      <StepComponent role={role} form={form} setField={setField} errors={errors} {...step.props} />

      {showErrors && hasErrors(errors) && (
        <Notice tone="danger">Some fields need your attention. Fix the ones marked in red to continue.</Notice>
      )}
      {submitError && <Notice tone="danger">{submitError}</Notice>}

      <div className={styles.actions}>
        {stepIndex > 0 ? (
          <Button variant="secondary" onClick={() => goTo(stepIndex - 1)} disabled={submitting}>
            Back
          </Button>
        ) : (
          <Button variant="secondary" onClick={onChangeRole}>
            Change account type
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
