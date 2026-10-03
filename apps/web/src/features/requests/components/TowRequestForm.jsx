import { Link } from 'react-router'
import { TextField } from '../../../components/FormField.jsx'
import DestinationField from '../../logistics/components/DestinationField.jsx'
import PickupField from '../../logistics/components/PickupField.jsx'
import { TOW_PROBLEM_TYPES } from '../../logistics/constants.js'
import { useDestinations } from '../../logistics/useDestinations.js'
import { carLabel } from '../../cars/format.js'
import { useMyCars } from '../../cars/useMyCars.js'
import { EMPTY_CAR, toCar, validateCar } from '../carDetails.js'
import { REQUEST_TYPES } from '../constants.js'
import { useRequestForm } from '../useRequestForm.js'
import CarFields from './CarFields.jsx'
import RequestFormShell from './RequestFormShell.jsx'

const NEW_CAR = 'new'
const NOTE_MAX_LENGTH = 300

const pinText = ({ lat, lng }) => `Pin on the map (${lat.toFixed(5)}, ${lng.toFixed(5)})`

/**
 * "Request tow": pickup (pin on a map and/or notes), destination (a mechanic, a parts shop or an
 * address), which car, what is wrong, and a short note.
 * @param {Object} props
 * @param {Object} props.company
 * @param {{ lat: number, lng: number } | null} [props.pickupPosition]  from "Use my location" on the
 *   tow page: only a starting point, the customer adjusts and confirms it by sending the form
 */
export default function TowRequestForm({ company, pickupPosition = null, onSent, onCancel }) {
  const { cars } = useMyCars()
  const destinations = useDestinations()

  const savedCar = (choice) => cars.find((car) => car.id === choice) ?? null
  const isEnteringCar = (choice) => cars.length === 0 || choice === NEW_CAR
  // The typed text of a mechanic or shop, as one of the choices (or undefined)
  const chosenPlace = (values) => destinations[values.destKind]?.find((option) => option.label === values.destination.trim())

  const form = useRequestForm({
    type: REQUEST_TYPES.TOW,
    targetId: company.id,
    initialValues: {
      position: pickupPosition,
      pickup: '',
      destKind: 'mechanic',
      destination: '',
      carChoice: '',
      ...EMPTY_CAR,
      problemType: '',
      note: '',
    },
    validate: (values) => {
      const errors = {}
      if (!values.position && !values.pickup.trim()) {
        errors.pickup = 'Share your location, place the pin, or describe where the car is.'
      }
      if (!values.destination.trim()) errors.destination = 'Enter where the car should go.'
      else if (values.destKind !== 'custom' && !chosenPlace(values)) {
        errors.destination = 'Pick one from the list, or choose "Another address".'
      }
      if (isEnteringCar(values.carChoice)) Object.assign(errors, validateCar(values))
      else if (!savedCar(values.carChoice)) errors.carChoice = 'Choose one of your cars, or enter a different one.'
      if (!values.problemType) errors.problemType = 'Choose what is wrong.'
      return errors
    },
    toData: (values) => {
      const place = values.destKind === 'custom' ? null : chosenPlace(values)
      const saved = isEnteringCar(values.carChoice) ? null : savedCar(values.carChoice)
      return {
        pickup: values.pickup.trim() || pinText(values.position),
        // The pin is saved only now, because the customer confirmed it by sending the form.
        ...(values.position && { pickupPosition: values.position }),
        destination: place ? place.address : values.destination.trim(),
        ...(place && { destinationType: values.destKind, destinationId: place.id }),
        car: saved ? { make: saved.make, model: saved.model, year: saved.year } : toCar(values),
        ...(saved && { carId: saved.id }),
        problemType: values.problemType,
        note: values.note.trim(),
      }
    },
    onSent,
  })
  const { values, setValue, errors } = form
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
      submitLabel="Request tow"
    >
      <PickupField
        position={values.position}
        onPositionChange={(position) => setValue('position', position)}
        startAt={company.base}
        notes={values.pickup}
        onNotesChange={(notes) => setValue('pickup', notes)}
        error={errors.pickup}
      />
      <DestinationField
        kind={values.destKind}
        onKindChange={(kind) => {
          setValue('destKind', kind)
          setValue('destination', '')
        }}
        value={values.destination}
        onChange={(text) => setValue('destination', text)}
        destinations={destinations}
        error={errors.destination}
      />

      {cars.length > 0 && (
        <TextField
          as="select"
          label="Car"
          hint={
            <>
              Your cars from <Link to="/my-cars">My Cars</Link>.
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
      {isEnteringCar(values.carChoice) && <CarFields values={values} setValue={setValue} errors={errors} />}

      <TextField as="select" label="What is wrong?" {...bind('problemType')}>
        <option value="">Choose a problem</option>
        {TOW_PROBLEM_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </TextField>
      <TextField
        as="textarea"
        label="Note"
        optional
        hint={`E.g. the car is in an underground parking. ${values.note.length}/${NOTE_MAX_LENGTH}`}
        rows={3}
        maxLength={NOTE_MAX_LENGTH}
        {...bind('note')}
      />
    </RequestFormShell>
  )
}
