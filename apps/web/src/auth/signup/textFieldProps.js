// Props for a TextField bound to a top-level signup form field:
// <TextField label="City" {...textFieldProps('city', { form, setField, errors })} />
export function textFieldProps(name, { form, setField, errors }) {
  return {
    id: name,
    value: form[name],
    onChange: (event) => setField(name, event.target.value),
    error: errors[name],
  }
}
