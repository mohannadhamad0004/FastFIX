import { useState } from 'react'

// Form state for forms that save through a mock service (account, profile):
//   const form = useSaveForm({ email: '', phone: '' })
//   <TextField label="Email" {...form.bind('email')} />
//   const saved = await form.submit({ validate, save: (values) => service.updateContact(values) })
// validate(values) returns { [fieldId]: message } in on-screen order; field ids are element ids, so
// the first invalid field gets focus. An error with a `field` (ProfileError, ...) is shown on that
// field, any other error above the buttons as `formError`.
export function useSaveForm(initialValues) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const focus = (id) => requestAnimationFrame(() => document.getElementById(id)?.focus())

  /** @returns {Promise<any>} what save resolved with (true if nothing), or false when it didn't save */
  async function submit({ validate = () => ({}), save }) {
    setFormError(null)
    const found = validate(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      focus(firstInvalid)
      return false
    }

    setSaving(true)
    try {
      return (await save(values)) ?? true
    } catch (error) {
      if (error.field) {
        setErrors({ [error.field]: error.message })
        focus(error.field)
      } else {
        setFormError(error.message || "Couldn't save your changes. Please try again.")
      }
      return false
    } finally {
      setSaving(false)
    }
  }

  // Props for a TextField bound to one value.
  const bind = (name) => ({
    id: name,
    value: values[name],
    onChange: (event) => setValue(name, event.target.value),
    error: errors[name],
  })

  return { values, setValues, setValue, errors, formError, saving, submit, bind }
}
