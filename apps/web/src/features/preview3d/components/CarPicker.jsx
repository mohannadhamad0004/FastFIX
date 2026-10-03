import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import Select from '../../../components/Select.jsx'
import styles from './CarPicker.module.css'

// Make -> model -> year selects. `vehicles` comes from the marketplace (getVehicleOptions), so
// only cars that some part fits are offered. onChange(car) fires once all three are chosen, and
// onChange(null) when the car is cleared.
export default function CarPicker({ vehicles, car, onChange }) {
  const [make, setMake] = useState(car?.make ?? '')
  const [model, setModel] = useState(car?.model ?? '')
  const [year, setYear] = useState(car ? String(car.year) : '')

  const models = vehicles.find((v) => v.make === make)?.models ?? []
  const range = models.find((m) => m.name === model)
  const years = range ? Array.from({ length: range.yearTo - range.yearFrom + 1 }, (_, i) => range.yearTo - i) : []

  function choose(nextMake, nextModel, nextYear) {
    setMake(nextMake)
    setModel(nextModel)
    setYear(nextYear)
    onChange(nextMake && nextModel && nextYear ? { make: nextMake, model: nextModel, year: Number(nextYear) } : null)
  }

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>Your car</legend>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>Make</span>
          <Select value={make} onChange={(event) => choose(event.target.value, '', '')}>
            <option value="">Choose a make</option>
            {vehicles.map((v) => (
              <option key={v.make} value={v.make}>
                {v.make}
              </option>
            ))}
          </Select>
        </label>
        <label className={styles.field}>
          <span>Model</span>
          <Select value={model} disabled={!make} onChange={(event) => choose(make, event.target.value, '')}>
            <option value="">Choose a model</option>
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </Select>
        </label>
        <label className={styles.field}>
          <span>Year</span>
          <Select value={year} disabled={!model} onChange={(event) => choose(make, model, event.target.value)}>
            <option value="">Choose a year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </label>
        {make && (
          <Button variant="secondary" className={styles.clear} onClick={() => choose('', '', '')}>
            Clear
          </Button>
        )}
      </div>
    </fieldset>
  )
}
