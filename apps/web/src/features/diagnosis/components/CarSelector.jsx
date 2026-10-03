import { TextField } from '../../../components/FormField.jsx'
import { MAX_CAR_YEAR, MIN_CAR_YEAR } from '../../requests/carDetails.js'
import { COMMON_MAKES, OTHER_CAR } from '../constants.js'
import styles from './CarSelector.module.css'

/**
 * Which car the problem is about. Logged-in users with registered cars pick one or choose
 * "Another car"; everyone else types make, model and year.
 * @param {Object} props
 * @param {{ savedId: string, make: string, model: string, year: string }} props.value
 *   savedId: a car id, OTHER_CAR, or '' (the first saved car, if there are any)
 * @param {(changes: Partial<typeof props.value>) => void} props.onChange
 * @param {import('../../cars/types.js').Car[]} props.cars  the user's cars ([] when logged out)
 * @param {{ make?: string, model?: string, year?: string }} props.errors
 */
export default function CarSelector({ value, onChange, cars, errors }) {
  const useSaved = cars.length > 0 && value.savedId !== OTHER_CAR
  const field = (name) => ({
    id: `car-${name}`,
    value: value[name],
    // Typing a car marks it as "Another car", so it isn't swapped for a saved car after logging in.
    onChange: (event) => onChange({ [name]: event.target.value, ...(value.savedId === '' && { savedId: OTHER_CAR }) }),
    error: errors[name],
  })

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Your car</legend>

      {cars.length > 0 && (
        <TextField
          as="select"
          id="car-saved"
          label="Choose a car"
          value={useSaved ? value.savedId || cars[0].id : OTHER_CAR}
          onChange={(event) => onChange({ savedId: event.target.value })}
        >
          {cars.map((car) => (
            <option key={car.id} value={car.id}>
              {car.make} {car.model} {car.year}
              {car.nickname ? ` · ${car.nickname}` : ''}
            </option>
          ))}
          <option value={OTHER_CAR}>Another car…</option>
        </TextField>
      )}

      {!useSaved && (
        <div className={styles.row}>
          <TextField label="Make" placeholder="e.g. Hyundai" autoComplete="off" list="car-make-options" {...field('make')} />
          <datalist id="car-make-options">
            {COMMON_MAKES.map((make) => (
              <option key={make} value={make} />
            ))}
          </datalist>
          <TextField label="Model" placeholder="e.g. Accent" autoComplete="off" {...field('model')} />
          <TextField
            label="Year"
            type="number"
            inputMode="numeric"
            min={MIN_CAR_YEAR}
            max={MAX_CAR_YEAR}
            placeholder="e.g. 2016"
            {...field('year')}
          />
        </div>
      )}
    </fieldset>
  )
}
