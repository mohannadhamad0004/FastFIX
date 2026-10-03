import { TextField } from '../../../components/FormField.jsx'
import { MAX_CAR_YEAR, MIN_CAR_YEAR } from '../carDetails.js'
import { FieldRow } from './RequestFormShell.jsx'

// Make, model and year inputs. `values` holds make/model/year; setValue(name, value).
export default function CarFields({ values, setValue, errors }) {
  const bind = (name) => ({
    id: name,
    value: values[name],
    onChange: (event) => setValue(name, event.target.value),
    error: errors[name],
  })

  return (
    <FieldRow>
      <TextField label="Make" placeholder="Hyundai" autoComplete="off" {...bind('make')} />
      <TextField label="Model" placeholder="Accent" autoComplete="off" {...bind('model')} />
      <TextField
        label="Year"
        type="number"
        inputMode="numeric"
        min={MIN_CAR_YEAR}
        max={MAX_CAR_YEAR}
        placeholder="2016"
        {...bind('year')}
      />
    </FieldRow>
  )
}
