import { useState } from 'react'
import { useRequestsService } from './RequestsContext.js'
import { RequestError } from './requestsService.js'

// Shared state for the request forms: values, validation, submitting and errors.
//   validate(values) -> { [fieldId]: message } (checked in on-screen order)
//   toData(values)   -> the `data` passed to createRequest
//   onSent(request)  -> after sending, with the new request (its chat is /chats/<request.id>)
// Field ids are also the element ids, so the first invalid field gets focus.
export function useRequestForm({ type, targetId, initialValues, validate, toData, onSent }) {
  const service = useRequestsService()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)
    const found = validate(values)
    setErrors(found)
    const [firstInvalid] = Object.keys(found)
    if (firstInvalid) {
      requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus())
      return
    }

    setSubmitting(true)
    try {
      const request = await service.createRequest(type, targetId, toData(values))
      onSent(request)
    } catch (error) {
      if (error instanceof RequestError && error.field) setErrors({ [error.field]: error.message })
      else setFormError(error.message || "Couldn't send your request. Please try again.")
      setSubmitting(false)
    }
  }

  return { values, setValue, errors, formError, submitting, handleSubmit }
}
