import { useId } from 'react'
import FormField, { TextField } from '../../../components/FormField.jsx'
import Input from '../../../components/Input.jsx'
import Select from '../../../components/Select.jsx'
import { DESTINATION_KINDS } from '../useDestinations.js'

/**
 * Kind of destination plus the place: a searchable list of mechanics or shops (type to filter), or a
 * free address. `value` holds the typed text; the form turns it into an address with useDestinations().
 * @param {Object} props
 * @param {string} props.kind
 * @param {(kind: string) => void} props.onKindChange
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {ReturnType<typeof useDestinations>} props.destinations
 * @param {string} [props.error]
 */
export default function DestinationField({ kind, onKindChange, value, onChange, destinations, error }) {
  const listId = useId()
  const options = destinations[kind] ?? []
  const describedBy = ['destination-hint', error && 'destination-error'].filter(Boolean).join(' ')

  return (
    <>
      <FormField id="destinationKind" label="Destination">
        <Select id="destinationKind" value={kind} onChange={(event) => onKindChange(event.target.value)}>
          {DESTINATION_KINDS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Select>
      </FormField>
      {kind === 'custom' ? (
        <TextField
          id="destination"
          label="Destination address"
          hint="A workshop, home or any address."
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={error}
        />
      ) : (
        <FormField
          id="destination"
          label={kind === 'mechanic' ? 'Choose a mechanic' : 'Choose a parts shop'}
          hint="Start typing a name or city, then pick from the list."
          error={error}
        >
          <Input
            id="destination"
            list={listId}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="off"
            invalid={Boolean(error)}
            aria-describedby={describedBy}
          />
          <datalist id={listId}>
            {options.map((option) => (
              <option key={option.id} value={option.label} />
            ))}
          </datalist>
        </FormField>
      )}
    </>
  )
}
