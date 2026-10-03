import { useEffect, useState } from 'react'
import { useAuth } from '../../../../auth/useAuth.js'
import Button from '../../../../components/Button.jsx'
import { TextField } from '../../../../components/FormField.jsx'
import Notice from '../../../../components/Notice.jsx'
import { carLabel } from '../../../cars/format.js'
import { useMyCars } from '../../../cars/useMyCars.js'
import { findCity } from '../../../logistics/cities.js'
import TowIcon from '../../../logistics/components/TowIcon.jsx'
import { useGeolocation } from '../../../logistics/useGeolocation.js'
import { EMERGENCY_KINDS, EMERGENCY_PROBLEMS } from '../constants.js'
import { useEmergency } from '../EmergencyContext.js'
import { EmergencyError } from '../mockDispatchService.js'
import EmergencyMap from './EmergencyMap.jsx'
import styles from './EmergencyForm.module.css'

const NEW_CAR = 'new'
const NOTE_MAX_LENGTH = 300

/**
 * Step 1 of the emergency screen: where you are (the browser's exact location, or a pin on the map),
 * what you need (a tow or a mechanic on the road), quick details and a phone number. Everything is
 * optional except the phone number. Logged-in customers send with one tap; visitors add a name.
 */
export default function EmergencyForm() {
  const { user } = useAuth()
  const { service, rememberVisitorEmergency } = useEmergency()
  const { cars } = useMyCars()
  const geo = useGeolocation()
  const [position, setPosition] = useState(null) // { lat, lng, source: 'gps' | 'pin' }
  const [kind, setKind] = useState('')
  const [landmark, setLandmark] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [carChoice, setCarChoice] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [problemType, setProblemType] = useState('')
  const [note, setNote] = useState('')
  const [simulate, setSimulate] = useState(() => service.isSimulating())
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  // Ask for the exact location as soon as the screen opens
  useEffect(() => {
    let current = true
    geo.locate({ fresh: true }).then((found) => {
      if (current && found) setPosition({ ...found, source: 'gps' })
    })
    return () => {
      current = false
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once, when the form opens
  }, [])

  const locating = geo.status === 'locating'
  const enteringCar = cars.length === 0 || carChoice === NEW_CAR
  const typedCity = !position && landmark.trim() ? findCity(landmark) : null

  function pick(next) {
    setPosition({ ...next, source: 'pin' })
    setErrors((current) => ({ ...current, location: undefined }))
  }

  async function send(event) {
    event.preventDefault()
    setErrors({})
    setSending(true)
    try {
      const saved = enteringCar ? null : cars.find((car) => car.id === carChoice)
      const car = saved
        ? { make: saved.make, model: saved.model, year: saved.year }
        : make.trim() || model.trim()
          ? { make: make.trim(), model: model.trim() }
          : null
      service.setSimulation(simulate)
      const emergency = await service.createEmergency({
        kind,
        location: position,
        landmark,
        phone,
        name,
        car,
        carId: saved?.id ?? null,
        problemType: problemType || 'other',
        note,
      })
      if (!user) rememberVisitorEmergency(emergency.id)
    } catch (error) {
      if (error instanceof EmergencyError) setErrors({ [error.field ?? 'form']: error.message })
      else setErrors({ form: "We couldn't send your emergency. Please try again, or call a tow company directly." })
      setSending(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={send} noValidate>
      {/* 1. Location */}
      <section className={styles.section} aria-labelledby="em-location">
        <h2 id="em-location" className={styles.heading}>
          1. Where are you?
        </h2>
        {locating && (
          <p className={styles.locating} role="status">
            <span className={styles.spinner} aria-hidden="true" />
            Getting your exact location…
          </p>
        )}
        {position?.source === 'gps' && !locating && <p className={styles.good}>Your location was found. Drag the pin if it is not exact.</p>}
        {geo.status === 'error' && !position && (
          <Notice tone="warning">{geo.error} Drop a pin on the map, or type a landmark or city below.</Notice>
        )}
        {(position || geo.status === 'error') && <EmergencyMap customer={position} onPick={pick} className={styles.map} />}
        {!position && geo.status === 'error' && <p className={styles.hint}>Tap the map to drop your pin.</p>}
        <div className={styles.row}>
          <Button variant="secondary" onClick={() => geo.locate({ fresh: true }).then((found) => found && setPosition({ ...found, source: 'gps' }))} loading={locating}>
            {!locating && <TowIcon name="locate" size={18} />}
            {locating ? 'Getting your exact location…' : 'Use my location again'}
          </Button>
          {typedCity && (
            <Button variant="ghost" onClick={() => pick({ lat: typedCity.lat, lng: typedCity.lng })}>
              Place the pin in {typedCity.name}
            </Button>
          )}
        </div>
        <TextField
          id="em-landmark"
          label="Landmark or city"
          optional
          hint="E.g. near City Mall, Huwara checkpoint road, or just a city name."
          value={landmark}
          onChange={(event) => setLandmark(event.target.value)}
          autoComplete="off"
        />
        {errors.location && <Notice tone="danger">{errors.location}</Notice>}
      </section>

      {/* 2. What */}
      <section className={styles.section} aria-labelledby="em-kind">
        <h2 id="em-kind" className={styles.heading}>
          2. What do you need?
        </h2>
        <div className={styles.kinds} role="radiogroup" aria-labelledby="em-kind">
          {EMERGENCY_KINDS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={kind === item.value}
              className={`${styles.kind} ${kind === item.value ? styles.kindSelected : ''}`}
              onClick={() => {
                setKind(item.value)
                setErrors((current) => ({ ...current, kind: undefined }))
              }}
            >
              <TowIcon name={item.icon} size={32} />
              {item.label}
            </button>
          ))}
        </div>
        {errors.kind && <Notice tone="danger">{errors.kind}</Notice>}
      </section>

      {/* 3. Details */}
      <section className={styles.section} aria-labelledby="em-details">
        <h2 id="em-details" className={styles.heading}>
          3. Quick details
        </h2>
        <div className={styles.grid}>
          {!user && (
            <TextField id="em-name" label="Your name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
          )}
          <TextField
            id="em-phone"
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            hint="The driver calls this number."
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value)
              setErrors((current) => ({ ...current, phone: undefined }))
            }}
            error={errors.phone}
          />
        </div>

        {cars.length > 0 && (
          <TextField as="select" id="em-car" label="Car" optional value={carChoice} onChange={(event) => setCarChoice(event.target.value)}>
            <option value="">Choose a car</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {carLabel(car)}
              </option>
            ))}
            <option value={NEW_CAR}>Another car…</option>
          </TextField>
        )}
        {enteringCar && (
          <div className={styles.grid}>
            <TextField id="em-make" label="Make" optional placeholder="Hyundai" autoComplete="off" value={make} onChange={(event) => setMake(event.target.value)} />
            <TextField id="em-model" label="Model" optional placeholder="Accent" autoComplete="off" value={model} onChange={(event) => setModel(event.target.value)} />
          </div>
        )}

        <TextField as="select" id="em-problem" label="What happened?" optional value={problemType} onChange={(event) => setProblemType(event.target.value)}>
          <option value="">Choose a problem</option>
          {EMERGENCY_PROBLEMS.map((problem) => (
            <option key={problem.value} value={problem.value}>
              {problem.label}
            </option>
          ))}
        </TextField>
        <TextField
          as="textarea"
          id="em-note"
          label="Note"
          optional
          rows={2}
          maxLength={NOTE_MAX_LENGTH}
          hint={`${note.length}/${NOTE_MAX_LENGTH}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </section>

      {errors.form && <Notice tone="danger">{errors.form}</Notice>}

      <div className={styles.send}>
        <Button type="submit" variant="danger" size="lg" fullWidth loading={sending} disabled={locating}>
          {sending ? 'Sending…' : 'Send emergency'}
        </Button>
        <label className={styles.demo}>
          <input type="checkbox" checked={simulate} onChange={(event) => setSimulate(event.target.checked)} />
          Demo: a simulated driver accepts after 5–15 seconds. Turn off to accept it yourself from a tow or mechanic account.
        </label>
      </div>
    </form>
  )
}
