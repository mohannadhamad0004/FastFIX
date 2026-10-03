import Button from '../../../components/Button.jsx'
import FileUpload from '../../../components/FileUpload.jsx'
import { TextField } from '../../../components/FormField.jsx'
import Notice from '../../../components/Notice.jsx'
import { useSaveForm } from '../../../hooks/useSaveForm.js'
import { COMMON_MAKES } from '../../diagnosis/constants.js'
import { MAX_CAR_YEAR, MIN_CAR_YEAR } from '../../requests/carDetails.js'
import { useCarsService } from '../CarsContext.js'
import { carErrors, NICKNAME_MAX_LENGTH } from '../carsService.js'
import styles from './CarForm.module.css'

const EMPTY = { nickname: '', make: '', model: '', year: '', mileageKm: '', vin: '', photo: null }

// Add a car (`car` null) or edit one. onDone(car) runs after saving.
export default function CarForm({ car = null, onDone, onCancel }) {
  const service = useCarsService()
  const form = useSaveForm(
    car ? { ...EMPTY, ...car, year: String(car.year), mileageKm: String(car.mileageKm) } : EMPTY,
  )
  const { values, setValue, errors } = form

  async function handleSubmit(event) {
    event.preventDefault()
    const saved = await form.submit({
      validate: carErrors,
      save: (current) => (car ? service.updateCar(car.id, current) : service.addCar(current)),
    })
    if (saved) onDone(saved)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <TextField
        label="Nickname"
        optional
        hint="So you can tell your cars apart, e.g. Daily driver."
        maxLength={NICKNAME_MAX_LENGTH}
        autoComplete="off"
        {...form.bind('nickname')}
      />
      <div className={styles.grid}>
        <TextField label="Make" placeholder="e.g. Hyundai" autoComplete="off" list="car-form-makes" {...form.bind('make')} />
        <datalist id="car-form-makes">
          {COMMON_MAKES.map((make) => (
            <option key={make} value={make} />
          ))}
        </datalist>
        <TextField label="Model" placeholder="e.g. Accent" autoComplete="off" {...form.bind('model')} />
        <TextField
          label="Year"
          type="number"
          inputMode="numeric"
          min={MIN_CAR_YEAR}
          max={MAX_CAR_YEAR}
          placeholder="e.g. 2016"
          {...form.bind('year')}
        />
        <TextField
          label="Mileage (km)"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          placeholder="e.g. 148200"
          {...form.bind('mileageKm')}
        />
      </div>
      <TextField
        label="VIN"
        optional
        hint="The 17-character vehicle identification number, on the registration or the windshield corner."
        autoComplete="off"
        maxLength={17}
        className={styles.vin}
        {...form.bind('vin')}
        onChange={(event) => setValue('vin', event.target.value.toUpperCase())}
      />
      <FileUpload
        id="photo"
        label="Photo"
        optional
        kind="image"
        value={values.photo}
        onChange={(file) => setValue('photo', file)}
        error={errors.photo}
      />

      {form.formError && <Notice tone="danger">{form.formError}</Notice>}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel} disabled={form.saving}>
          Cancel
        </Button>
        <Button type="submit" loading={form.saving}>
          {form.saving ? 'Saving…' : car ? 'Save car' : 'Add car'}
        </Button>
      </div>
    </form>
  )
}
