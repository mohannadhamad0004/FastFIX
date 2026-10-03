import { useMemo, useState } from 'react'
import { useAuthQuery } from '../../../auth/useAuth.js'
import { ROLES } from '../../../authorization/roles.js'
import Avatar from '../../../components/Avatar.jsx'
import Button from '../../../components/Button.jsx'
import Modal from '../../../components/Modal.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { serviceModeLabel } from '../../../auth/signup/constants.js'
import ServiceRequestForm from '../../requests/components/ServiceRequestForm.jsx'
import { RatingSummary } from '../../requests/components/Stars.jsx'
import { useRatingSummaries } from '../../requests/ReviewsContext.js'
import { sortByRating } from '../../requests/reviewsService.js'
import styles from './SendToMechanicDialog.module.css'

// TODO: replace with real API call (GET /api/mechanics)
const loadMechanics = (service) => service.getDirectory(ROLES.MECHANIC)

// "Send to a mechanic" on a saved AI report: choose a mechanic (those with the suggested skill
// first, best rated first), then the usual "Request service" form with the report attached.
export default function SendToMechanicDialog({ diagnosis, open, onClose }) {
  return (
    <Modal open={open} title="Send your AI report to a mechanic" onClose={onClose} wide>
      {open && <SendSteps diagnosis={diagnosis} onClose={onClose} />}
    </Modal>
  )
}

function SendSteps({ diagnosis, onClose }) {
  const { data: mechanics, error } = useAuthQuery(loadMechanics)
  const ratings = useRatingSummaries()
  const [showAll, setShowAll] = useState(false)
  const [mechanic, setMechanic] = useState(null)
  const [sent, setSent] = useState(null)
  const skill = diagnosis.suggestedSkill

  const choices = useMemo(() => {
    const list = (mechanics ?? []).filter((m) => showAll || m.skills.some((s) => s.skill === skill))
    return sortByRating(list, ratings)
  }, [mechanics, ratings, showAll, skill])

  if (sent) {
    return (
      <div className={styles.step}>
        <Notice tone="success" title="Request sent">
          {sent.target.name} got your request with the AI report. Chat with them about it in Chats.
        </Notice>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
          <Button to={`/chats/${sent.id}`}>Open chat</Button>
        </div>
      </div>
    )
  }

  if (mechanic) {
    return (
      <div className={styles.step}>
        <div className={styles.chosen}>
          <span>
            To <strong>{mechanic.workshopName}</strong> ({mechanic.city})
          </span>
          <Button size="sm" variant="ghost" onClick={() => setMechanic(null)}>
            Change mechanic
          </Button>
        </div>
        <ServiceRequestForm mechanic={mechanic} diagnosis={diagnosis} onSent={setSent} onCancel={onClose} />
      </div>
    )
  }

  return (
    <div className={styles.step}>
      <p className={styles.muted}>
        {showAll ? 'All verified mechanics' : `Mechanics with the suggested skill: ${skill}`}, best rated first.
      </p>
      {error && <Notice tone="danger">Couldn't load mechanics. Please try again.</Notice>}
      {!mechanics && !error && <SkeletonRows rows={3} label="Loading mechanics…" />}
      {mechanics && choices.length === 0 && <p className={styles.muted}>No mechanic lists {skill} yet.</p>}
      {choices.length > 0 && (
        <ul className={styles.list}>
          {choices.map((m) => (
            <li key={m.id}>
              <button type="button" className={styles.choice} onClick={() => setMechanic(m)}>
                <Avatar file={m.profilePhoto} name={m.name} />
                <span className={styles.choiceText}>
                  <span className={styles.choiceName}>{m.workshopName}</span>
                  <span className={styles.muted}>
                    {m.name} · {m.city}
                  </span>
                  <RatingSummary summary={ratings[m.id]} />
                  <span className={styles.muted}>{m.serviceModes.map(serviceModeLabel).join(' · ')}</span>
                </span>
                <span className={styles.chevron} aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => setShowAll((value) => !value)}>
          {showAll ? `Only ${skill} mechanics` : 'Show all mechanics'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
