import { TextField } from '../../../components/FormField.jsx'
import { REQUEST_TYPES } from '../constants.js'
import { useRequestForm } from '../useRequestForm.js'
import RequestFormShell from './RequestFormShell.jsx'
import styles from './PartQuestionForm.module.css'

const MESSAGE_MAX_LENGTH = 500
const MAX_QUANTITY = 999

function validate(values) {
  const errors = {}
  if (!values.message.trim()) errors.message = 'Write your message to the shop.'
  const quantity = Number(values.quantity)
  if (!String(values.quantity).trim()) errors.quantity = 'Enter how many you need.'
  else if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    errors.quantity = `Enter a whole number from 1 to ${MAX_QUANTITY}.`
  }
  return errors
}

// "Ask about this part": a message to the shop and how many are needed.
export default function PartQuestionForm({ part, shop, onSent, onCancel }) {
  const form = useRequestForm({
    type: REQUEST_TYPES.PART_QUESTION,
    targetId: shop.id,
    initialValues: { message: '', quantity: '1' },
    validate,
    toData: (values) => ({ partId: part.id, message: values.message.trim(), quantity: Number(values.quantity) }),
    onSent,
  })
  const { values, setValue, errors } = form

  return (
    <RequestFormShell
      onSubmit={form.handleSubmit}
      onCancel={onCancel}
      submitting={form.submitting}
      formError={form.formError}
      submitLabel="Send question"
    >
      <p className={styles.part}>
        <strong>{part.name}</strong>
        <span>
          {part.oemNumber} · {shop.name}
        </span>
      </p>
      <TextField
        id="message"
        as="textarea"
        label="Message to the shop"
        hint={`E.g. does it fit a 2016 Accent with the 1.4 engine? ${values.message.length}/${MESSAGE_MAX_LENGTH}`}
        rows={4}
        maxLength={MESSAGE_MAX_LENGTH}
        value={values.message}
        onChange={(event) => setValue('message', event.target.value)}
        error={errors.message}
      />
      <TextField
        id="quantity"
        label="Quantity"
        type="number"
        inputMode="numeric"
        min="1"
        max={MAX_QUANTITY}
        className={styles.quantity}
        value={values.quantity}
        onChange={(event) => setValue('quantity', event.target.value)}
        error={errors.quantity}
      />
    </RequestFormShell>
  )
}
