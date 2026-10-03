import { useState } from 'react'
import Button from '../../../../components/Button.jsx'
import Modal from '../../../../components/Modal.jsx'
import Notice from '../../../../components/Notice.jsx'
import { useToast } from '../../../../components/Toast/ToastContext.js'
import { formatDistance } from '../../../logistics/geo.js'
import { truckTypeLabel } from '../../../logistics/format.js'
import { RatingSummary } from '../../components/Stars.jsx'
import { useRatingSummaries } from '../../ReviewsContext.js'
import { ACTIVE_EMERGENCY, emergencyKindLabel, emergencyProblemLabel } from '../constants.js'
import { useEmergency, useNow } from '../EmergencyContext.js'
import EmergencyChat from './EmergencyChat.jsx'
import EmergencyMap from './EmergencyMap.jsx'
import StatusSteps from './StatusSteps.jsx'
import styles from './EmergencyTracker.module.css'

const secondsLeft = (iso, now) => Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 1000))

/**
 * Step 2 of the emergency screen: what is happening with the emergency the customer sent. Searching
 * (with the widening radius), no one available (call the nearest companies), accepted and on the
 * way (responder, map, arrival estimate, chat, cancel), or ended.
 * @param {{ emergency: import('../types.js').Emergency }} props
 */
export default function EmergencyTracker({ emergency }) {
  const { service, dismiss } = useEmergency()
  const toast = useToast()
  const ratings = useRatingSummaries()
  const now = useNow(1000)
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const { status, responder } = emergency
  const active = ACTIVE_EMERGENCY.includes(status)

  async function cancel() {
    setCancelling(true)
    try {
      await service.cancelEmergency(emergency.id)
      toast.success('Your emergency was cancelled.')
      setConfirming(false)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setCancelling(false)
    }
  }

  const header = (
    <div className={styles.summary}>
      <p className={styles.kind}>
        {emergencyKindLabel(emergency.kind)} · {emergencyProblemLabel(emergency.details.problemType)}
      </p>
      <StatusSteps status={status} />
    </div>
  )

  // --- Ended without a responder, or finished ---
  if (status === 'unavailable') {
    return (
      <div className={styles.tracker}>
        <Notice tone="danger" title="No one available yet">
          Nobody accepted within 50 km. Call the nearest companies directly:
        </Notice>
        <ul className={styles.callList}>
          {(emergency.nearest ?? []).map((company) => (
            <li key={company.id} className={styles.callItem}>
              <span>
                <strong>{company.name}</strong>
                <span className={styles.muted}> · {formatDistance(company.distanceKm)}</span>
              </span>
              <Button to={`tel:${company.phone}`} variant="danger">
                Call {company.phone}
              </Button>
            </li>
          ))}
          {(emergency.nearest ?? []).length === 0 && <li className={styles.muted}>No companies found nearby. Call 100 or your insurance roadside line.</li>}
        </ul>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => dismiss(emergency.id)}>
            Close and try again
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'cancelled' || status === 'completed') {
    return (
      <div className={styles.tracker}>
        <Notice tone={status === 'completed' ? 'success' : 'info'} title={status === 'completed' ? 'Completed' : 'Cancelled'}>
          {status === 'completed'
            ? `${responder.company} marked the job as done. Stay safe.`
            : 'This emergency was cancelled. Location sharing has stopped.'}
        </Notice>
        <div className={styles.actions}>
          <Button onClick={() => dismiss(emergency.id)}>Done</Button>
        </div>
      </div>
    )
  }

  // --- Searching ---
  if (status === 'searching') {
    const pending = emergency.offers.filter((o) => o.status === 'pending')
    const next = pending[0] ? secondsLeft(pending[0].expiresAt, now) : null
    return (
      <div className={styles.tracker}>
        {header}
        <div className={styles.searching} role="status" aria-live="polite">
          <span className={styles.pulse} aria-hidden="true" />
          <div>
            <p className={styles.big}>Searching for the nearest {emergency.kind === 'tow' ? 'tow trucks' : 'mechanics'}…</p>
            <p className={styles.muted}>
              Sent to {pending.length} {pending.length === 1 ? 'responder' : 'responders'} within {emergency.radiusKm} km
              {next !== null && next > 0 && ` · widening the search in ${next} s`}
            </p>
          </div>
        </div>
        <EmergencyMap customer={emergency.location} className={styles.map} />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            Cancel emergency
          </Button>
        </div>
        <CancelDialog open={confirming} busy={cancelling} onConfirm={cancel} onClose={() => setConfirming(false)} />
      </div>
    )
  }

  // --- Accepted, on the way, arrived ---
  const distanceKm = Math.hypot(responder.location.lat - emergency.location.lat, responder.location.lng - emergency.location.lng) * 111
  const eta = status === 'arrived' ? null : emergency.etaMinutes
  return (
    <div className={styles.tracker}>
      {header}

      <div className={styles.columns}>
        <div className={styles.left}>
          <div className={styles.eta} role="status" aria-live="polite">
            {status === 'arrived' ? (
              <p className={styles.big}>{responder.name} has arrived.</p>
            ) : (
              <p className={styles.big}>
                {status === 'accepted' ? `${responder.name} accepted and is getting ready` : `${responder.name} is on the way`}
                {eta ? ` · about ${eta} min away` : ''}
              </p>
            )}
            <p className={styles.muted}>
              {status !== 'arrived' && `${formatDistance(distanceKm)} · `}the arrival estimate is a straight-line guess
              {responder.sharing ? ' · live location is shared with you' : ''}
            </p>
          </div>
          <EmergencyMap customer={emergency.location} responder={responder.location} responderKind={emergency.kind} className={styles.map} />
        </div>

        <div className={styles.right}>
          <section className={styles.responder} aria-label="Your responder">
            <div>
              <h3 className={styles.name}>{responder.name}</h3>
              <p className={styles.muted}>{responder.company}</p>
              <RatingSummary summary={ratings[responder.id]} />
              {responder.truck && (
                <p className={styles.truck}>
                  {truckTypeLabel(responder.truck.type)} truck · plate <strong>{responder.truck.plate}</strong>
                </p>
              )}
            </div>
            <Button to={`tel:${responder.phone}`} variant="danger" size="lg">
              Call {responder.phone}
            </Button>
          </section>

          {active && <EmergencyChat emergency={emergency} side="customer" />}

          <Button variant="secondary" onClick={() => setConfirming(true)}>
            Cancel emergency
          </Button>
        </div>
      </div>
      <CancelDialog open={confirming} busy={cancelling} onConfirm={cancel} onClose={() => setConfirming(false)} />
    </div>
  )
}

function CancelDialog({ open, busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title="Cancel this emergency?" onClose={onClose}>
      <p>The driver stops coming to you and your location is no longer shared.</p>
      <div className={styles.dialogActions}>
        <Button variant="secondary" onClick={onClose}>
          Keep the emergency
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={busy}>
          Yes, cancel it
        </Button>
      </div>
    </Modal>
  )
}
