import Button from '../../../components/Button.jsx'
import TowIcon from '../../logistics/components/TowIcon.jsx'
import styles from './MechanicSections.module.css'

// The static parts of /mechanics: the AI banner under the search, and "Why FastFix mechanics".

/** "Not sure what's wrong?" - sends the customer to the AI diagnosis on the home page. */
export function AiBanner() {
  return (
    <aside className={styles.ai} aria-labelledby="mechanics-ai">
      <span className={styles.aiIcon}>
        <TowIcon name="wrench" size={28} />
      </span>
      <div className={styles.aiText}>
        <h2 id="mechanics-ai" className={styles.aiTitle}>
          Not sure what&apos;s wrong? Let FastFix AI check your car first
        </h2>
        <p className={styles.aiSubtitle}>Upload a photo, video or the sound of the problem. We suggest the skill to look for.</p>
      </div>
      <Button to="/diagnose" size="lg" className={styles.aiButton}>
        Diagnose my car
      </Button>
    </aside>
  )
}

const REASONS = [
  { icon: 'shield', title: 'Certificates checked per skill', text: 'Every skill a mechanic lists needs its own certificate. An admin approves or rejects each one, and only approved skills are shown.' },
  { icon: 'clock', title: 'Reviewed by FastFix admins', text: 'Accounts are approved by an admin after a documents check, and a call, video call or visit. New skills and workshop names are reviewed again.' },
  { icon: 'chat', title: 'Real customer reviews', text: 'Only customers who completed a job can rate it, once. Admins hide abusive reviews, and the mechanic can reply.' },
]

export function WhyFastFix() {
  return (
    <section className={styles.why} aria-labelledby="mechanics-why">
      <h2 id="mechanics-why" className={styles.heading}>
        Why FastFix mechanics
      </h2>
      <ul className={styles.reasons}>
        {REASONS.map((reason) => (
          <li key={reason.title} className={styles.reason}>
            <span className={styles.reasonIcon}>
              <TowIcon name={reason.icon} size={24} />
            </span>
            <h3 className={styles.reasonTitle}>{reason.title}</h3>
            <p className={styles.muted}>{reason.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
