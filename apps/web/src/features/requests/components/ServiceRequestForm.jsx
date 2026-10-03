import { Link } from 'react-router'
import { SERVICE_MODES } from '../../../auth/signup/constants.js'
import FileUpload from '../../../components/FileUpload.jsx'
import { TextField } from '../../../components/FormField.jsx'
import { carLabel } from '../../cars/format.js'
import { useMyCars } from '../../cars/useMyCars.js'
import { EMPTY_CAR, toCar, validateCar } from '../carDetails.js'
import { REQUEST_TYPES } from '../constants.js'
import { useRequestForm } from '../useRequestForm.js'
import AttachedReport from './AttachedReport.jsx'
import CarFields from './CarFields.jsx'
import RequestFormShell, { FieldRow } from './RequestFormShell.jsx'
import ServiceModePicker from './ServiceModePicker.jsx'

const NEW_CAR = 'new'
const PROBLEM_MAX_LENGTH = 1000

// Today in the user's time zone, as "YYYY-MM-DD" for the date input's min.
function todayLocal() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

// The modes this mechanic offers, with a hint about where the service happens.
function modeOptions(mechanic) {
  const hints = {
    on_site: `Comes to you · covers ${mechanic.onSiteCities.join(', ')}`,
    workshop: `At ${mechanic.address}, ${mechanic.city}`,
    online: 'Advice through chat, no visit',
  }
  return SERVICE_MODES.filter((mode) => mechanic.serviceModes.includes(mode.value)).map((mode) => ({
    value: mode.value,
    label: mode.label,
    hint: hints[mode.value],
  }))
}

// Start from the attached AI report, if any: its car and what the customer described.
function initialValues(options, diagnosis) {
  const reportCar = diagnosis?.car
  return {
    mode: options.length === 1 ? options[0].value : '',
    location: '',
    preferredDate: '',
    preferredTime: '',
    carChoice: diagnosis ? (diagnosis.carId ?? NEW_CAR) : '',
    ...(reportCar && !diagnosis.carId
      ? { make: reportCar.make, model: reportCar.model, year: String(reportCar.year ?? '') }
      : EMPTY_CAR),
    problem: diagnosis ? diagnosis.description || `AI report: ${diagnosis.possibleCauses[0]?.cause}` : '',
    media: diagnosis?.file ? [diagnosis.file] : [],
  }
}

// "Request service" from a mechanic: how (one of the modes the mechanic offers), then what each
// mode needs - on-site: where the car is; workshop visit: a preferred date and time; online
// consultation: only the problem. Then which car (one of the customer's cars from /my-cars, or
// another one; not for online), what's wrong, and optional photo/video/audio.
// `diagnosis` (from the AI Agent page) is attached to the request as a copy of the report.
export default function ServiceRequestForm({ mechanic, diagnosis = null, onSent, onCancel }) {
  const { cars } = useMyCars()
  const options = modeOptions(mechanic)

  // A car id that is no longer in the garage counts as "not chosen yet".
  const savedCar = (choice) => cars.find((car) => car.id === choice) ?? null
  const isEnteringCar = (choice) => cars.length === 0 || choice === NEW_CAR

  const form = useRequestForm({
    type: REQUEST_TYPES.SERVICE,
    targetId: mechanic.id,
    initialValues: initialValues(options, diagnosis),
    validate: (values) => {
      const errors = {}
      if (!values.mode) errors.mode = 'Choose how you want the service.'
      if (values.mode === 'on_site' && !values.location.trim()) {
        errors.location = 'Enter where the car is, so the mechanic can find it.'
      }
      if (values.mode === 'workshop') {
        if (!values.preferredDate) errors.preferredDate = 'Choose a date.'
        else if (values.preferredTime && new Date(`${values.preferredDate}T${values.preferredTime}`) < new Date()) {
          errors.preferredDate = 'Choose a date and time in the future.'
        }
        if (!values.preferredTime) errors.preferredTime = 'Choose a time.'
      }
      if (values.mode !== 'online') {
        if (isEnteringCar(values.carChoice)) Object.assign(errors, validateCar(values))
        else if (!savedCar(values.carChoice)) errors.carChoice = 'Choose one of your cars, or enter a different one.'
      }
      if (!values.problem.trim()) errors.problem = 'Describe the problem.'
      else if (values.problem.trim().length < 10) errors.problem = 'Add a little more detail (at least 10 characters).'
      return errors
    },
    toData: (values) => {
      let car = null
      let carId = null
      if (values.mode !== 'online') {
        const saved = isEnteringCar(values.carChoice) ? null : savedCar(values.carChoice)
        car = saved ? { make: saved.make, model: saved.model, year: saved.year } : toCar(values)
        carId = saved?.id ?? null
      }
      return {
        mode: values.mode,
        ...(values.mode === 'on_site' && { location: values.location.trim() }),
        ...(values.mode === 'workshop' && { preferredAt: `${values.preferredDate}T${values.preferredTime}` }),
        car,
        ...(carId && { carId }),
        problem: values.problem.trim(),
        media: values.media,
        ...(diagnosis && { diagnosis }),
      }
    },
    onSent,
  })
  const { values, setValue, errors } = form
  const needsCar = values.mode !== 'online'
  const enteringCar = isEnteringCar(values.carChoice)
  const bind = (name) => ({
    id: name,
    value: values[name],
    onChange: (event) => setValue(name, event.target.value),
    error: errors[name],
  })

  return (
    <RequestFormShell
      onSubmit={form.handleSubmit}
      onCancel={onCancel}
      submitting={form.submitting}
      formError={form.formError}
      submitLabel="Send request"
    >
      {diagnosis && <AttachedReport diagnosis={diagnosis} />}

      <ServiceModePicker
        id="mode"
        legend="How do you want the service?"
        options={options}
        value={values.mode}
        onChange={(mode) => setValue('mode', mode)}
        error={errors.mode}
      />

      {values.mode === 'on_site' && (
        <TextField
          label="Where is the car?"
          hint="Street, landmark or parking, e.g. Rafidia Street, near the hospital."
          autoComplete="street-address"
          {...bind('location')}
        />
      )}
      {values.mode === 'workshop' && (
        <FieldRow>
          <TextField label="Preferred date" type="date" min={todayLocal()} {...bind('preferredDate')} />
          <TextField label="Preferred time" type="time" step="900" {...bind('preferredTime')} />
        </FieldRow>
      )}

      {needsCar && cars.length > 0 && (
        <TextField
          as="select"
          label="Car"
          hint={
            <>
              Your cars from <Link to="/my-cars">My Cars</Link>. The repair is added to the car's history.
            </>
          }
          {...bind('carChoice')}
        >
          <option value="">Choose a car</option>
          {cars.map((car) => (
            <option key={car.id} value={car.id}>
              {carLabel(car)}
            </option>
          ))}
          <option value={NEW_CAR}>Another car…</option>
        </TextField>
      )}
      {needsCar && enteringCar && <CarFields values={values} setValue={setValue} errors={errors} />}

      <TextField
        as="textarea"
        label="What's the problem?"
        hint={`When it happens, noises, warning lights… ${values.problem.length}/${PROBLEM_MAX_LENGTH}`}
        rows={4}
        maxLength={PROBLEM_MAX_LENGTH}
        {...bind('problem')}
      />
      <FileUpload
        id="media"
        label="Photo, video or audio"
        hint={
          diagnosis?.file
            ? 'The photo, video or sound from your AI report is added. Remove it or add more.'
            : 'A photo of a warning light or leak, a video, or a recording of the noise.'
        }
        optional
        kind="media"
        multiple
        value={values.media}
        onChange={(files) => setValue('media', files)}
        error={errors.media}
      />
    </RequestFormShell>
  )
}
