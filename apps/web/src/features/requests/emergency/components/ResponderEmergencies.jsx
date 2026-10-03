import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../../auth/useAuth.js'
import Button from '../../../../components/Button.jsx'
import Notice from '../../../../components/Notice.jsx'
import { useToast } from '../../../../components/Toast/ToastContext.js'
import { formatDistance } from '../../../logistics/geo.js'
import { emergencyKindLabel, emergencyProblemLabel, EMERGENCY_STATUS_LABELS, navigateUrl } from '../constants.js'
import { useEmergency, useNow, useResponderEmergencies } from '../EmergencyContext.js'
import EmergencyChat from './EmergencyChat.jsx'
import EmergencyMap from './EmergencyMap.jsx'
import StatusSteps from './StatusSteps.jsx'
import styles from './ResponderEmergencies.module.css'

const ALERT_KEY = 'fastfix.emergencyAlert'
const NEXT_STEPS = [
  { from: 'accepted', status: 'on_the_way', label: "I'm on the way" },
  { from: 'on_the_way', status: 'arrived', label: "I've arrived" },
  { from: 'arrived', status: 'completed', label: 'Mark as completed' },
]

const remaining = (iso, now) => Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000))
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

// A short double beep and a vibration. Browsers only allow sound after the user has touched the page.
function alertNow() {
  try {
    navigator.vibrate?.([300, 150, 300])
    const audio = new AudioContext()
    ;[0, 0.25].forEach((delay) => {
      const oscillator = audio.createOscillator()
      oscillator.frequency.value = 880
      oscillator.connect(audio.destination)
      oscillator.start(audio.currentTime + delay)
      oscillator.stop(audio.currentTime + delay + 0.18)
    })
  } catch {
    // no sound available: the red card is still on screen
  }
}

/**
 * Emergency requests for a tow company or a mechanic, at the top of their dashboard: open offers in
 * red (distance, problem, car, note, a countdown, Accept / Decline) and the job they accepted
 * (Navigate in Google Maps, call, chat, status buttons, live location shared with the customer).
 */
export default function ResponderEmergencies() {
  const { open, jobs } = useResponderEmergencies()
  const [alerts, setAlerts] = useState(() => {
    try {
      return localStorage.getItem(ALERT_KEY) === 'on'
    } catch {
      return false
    }
  })
  const seen = useRef(0)

  // Sound and vibration when a new request arrives (if the responder turned the alert on)
  useEffect(() => {
    if (alerts && open.length > seen.current) alertNow()
    seen.current = open.length
  }, [open.length, alerts])

  function toggleAlerts(on) {
    setAlerts(on)
    try {
      localStorage.setItem(ALERT_KEY, on ? 'on' : 'off')
    } catch {
      // not remembered
    }
    if (on) alertNow() // also lets the browser play sounds from now on
  }

  return (
    <section className={styles.section} aria-label="Emergency requests">
      <div className={styles.header}>
        <h2 className={styles.title}>Emergency requests</h2>
        <label className={styles.alert}>
          <input type="checkbox" checked={alerts} onChange={(event) => toggleAlerts(event.target.checked)} />
          Sound and vibration for new emergencies
        </label>
      </div>

      {jobs.map((job) => (
        <Job key={job.id} job={job} />
      ))}
      {open.map((emergency) => (
        <Offer key={emergency.id} emergency={emergency} />
      ))}
      {jobs.length === 0 && open.length === 0 && <p className={styles.none}>No emergencies right now. New ones appear here in red.</p>}
    </section>
  )
}

function Offer({ emergency }) {
  const { service } = useEmergency()
  const { user } = useAuth()
  const toast = useToast()
  const now = useNow(1000)
  const [busy, setBusy] = useState('')
  const offer = emergency.offers.find((o) => o.responderId === user.id && o.status === 'pending')
  const { details } = emergency

  async function answer(kind) {
    setBusy(kind)
    try {
      if (kind === 'accept') {
        await service.acceptOffer(emergency.id)
        toast.success('You got it. Navigate to the customer now.')
      } else await service.declineOffer(emergency.id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy('')
    }
  }

  return (
    <article className={styles.offer} aria-label="Emergency request">
      <header className={styles.offerHeader}>
        <span className={styles.badge}>EMERGENCY</span>
        <span className={styles.countdown} aria-label="Time left">
          Open for {clock(remaining(offer.expiresAt, now))}
        </span>
      </header>
      <h3 className={styles.what}>
        {emergencyKindLabel(emergency.kind)} · {emergencyProblemLabel(details.problemType)}
      </h3>
      <dl className={styles.facts}>
        <div>
          <dt>Distance</dt>
          <dd>{formatDistance(offer.distanceKm)}</dd>
        </div>
        <div>
          <dt>Car</dt>
          <dd>{details.car ? `${details.car.make} ${details.car.model}`.trim() : 'Not given'}</dd>
        </div>
        {details.note && (
          <div className={styles.wide}>
            <dt>Note</dt>
            <dd>{details.note}</dd>
          </div>
        )}
        {emergency.landmark && (
          <div className={styles.wide}>
            <dt>Landmark</dt>
            <dd>{emergency.landmark}</dd>
          </div>
        )}
      </dl>
      <div className={styles.actions}>
        <Button variant="danger" size="lg" onClick={() => answer('accept')} loading={busy === 'accept'} disabled={Boolean(busy)}>
          Accept
        </Button>
        <Button variant="secondary" size="lg" onClick={() => answer('decline')} loading={busy === 'decline'} disabled={Boolean(busy)}>
          Decline
        </Button>
      </div>
    </article>
  )
}

function Job({ job }) {
  const { service } = useEmergency()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const { responder, customer } = job
  const next = NEXT_STEPS.find((step) => step.from === job.status)

  // Location sharing: while the job is active, the phone's position goes to the customer. It stops
  // by itself when the job is completed or cancelled (responder.sharing turns off and the job disappears).
  const sharing = responder.sharing
  useEffect(() => {
    if (!sharing || !('geolocation' in navigator)) return undefined
    const watch = navigator.geolocation.watchPosition(
      ({ coords }) => service.updateResponderLocation(job.id, { lat: coords.latitude, lng: coords.longitude }),
      () => {}, // no permission: the mock moves the marker by itself
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [sharing, service, job.id])

  async function advance(status) {
    setBusy(true)
    try {
      await service.setStatus(job.id, status)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`${styles.offer} ${styles.job}`} aria-label="Your emergency job">
      <header className={styles.offerHeader}>
        <span className={styles.badge}>EMERGENCY JOB</span>
        <span className={styles.countdown}>{EMERGENCY_STATUS_LABELS[job.status]}</span>
      </header>
      <h3 className={styles.what}>
        {customer.name} · {emergencyKindLabel(job.kind)} · {emergencyProblemLabel(job.details.problemType)}
      </h3>
      <StatusSteps status={job.status} />
      <div className={styles.jobColumns}>
        <div className={styles.jobMain}>
          <EmergencyMap customer={job.location} responder={responder.location} responderKind={job.kind} className={styles.map} />
          <div className={styles.actions}>
            <Button to={navigateUrl(job.location)} target="_blank" rel="noopener noreferrer" variant="primary" size="lg">
              Navigate
            </Button>
            <Button to={`tel:${customer.phone}`} variant="secondary" size="lg">
              Call {customer.phone}
            </Button>
            {next && (
              <Button variant="danger" size="lg" onClick={() => advance(next.status)} loading={busy}>
                {next.label}
              </Button>
            )}
          </div>
          <dl className={styles.facts}>
            <div>
              <dt>Car</dt>
              <dd>{job.details.car ? `${job.details.car.make} ${job.details.car.model}`.trim() : 'Not given'}</dd>
            </div>
            {job.details.note && (
              <div className={styles.wide}>
                <dt>Note</dt>
                <dd>{job.details.note}</dd>
              </div>
            )}
          </dl>
          <Notice tone="info">Your location is shared with the customer until you complete the job or they cancel.</Notice>
        </div>
        <EmergencyChat emergency={job} side="responder" />
      </div>
    </article>
  )
}
