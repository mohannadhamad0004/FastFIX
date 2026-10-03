import Button from '../../../components/Button.jsx'
import Select from '../../../components/Select.jsx'
import styles from './VehiclePicker.module.css'

// Make / model / year selects for the vehicle the parts are checked against.
// `options` is getVehicleOptions(parts); `vehicle` is { make, model, year } or null.
export default function VehiclePicker({ vehicle, options, onChange }) {
  const make = vehicle?.make ?? ''
  const model = vehicle?.model ?? ''
  const year = vehicle?.year ?? null
  const models = options.find((option) => option.make === make)?.models ?? []
  const selectedModel = models.find((m) => m.name === model)
  const years = selectedModel
    ? Array.from({ length: selectedModel.yearTo - selectedModel.yearFrom + 1 }, (_, i) => selectedModel.yearTo - i)
    : []

  return (
    <div className={styles.picker}>
      <label className={styles.field}>
        <span>Make</span>
        <Select value={make} onChange={(event) => onChange(event.target.value ? { make: event.target.value, model: '', year: null } : null)}>
          <option value="">Choose a make</option>
          {options.map((option) => (
            <option key={option.make} value={option.make}>
              {option.make}
            </option>
          ))}
        </Select>
      </label>
      <label className={styles.field}>
        <span>Model</span>
        <Select value={model} disabled={!make} onChange={(event) => onChange({ make, model: event.target.value, year: null })}>
          <option value="">Any model</option>
          {models.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
            </option>
          ))}
        </Select>
      </label>
      <label className={styles.field}>
        <span>Year</span>
        <Select
          value={year ?? ''}
          disabled={!selectedModel}
          onChange={(event) => onChange({ make, model, year: event.target.value ? Number(event.target.value) : null })}
        >
          <option value="">Any year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </label>
      {make && (
        <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
          Clear vehicle
        </Button>
      )}
    </div>
  )
}
