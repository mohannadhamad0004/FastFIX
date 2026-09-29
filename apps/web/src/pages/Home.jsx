import Button from '../components/Button.jsx'
import styles from './Home.module.css'

const steps = [
  {
    title: 'Record the problem',
    text: 'Upload a photo of a warning light or leak, a video, or an audio clip of the engine noise.',
  },
  {
    title: 'Get a preliminary AI diagnosis',
    text: 'See what the AI observes, the most likely faults ranked by probability, and how urgent it is.',
  },
  {
    title: 'A mechanic confirms it',
    text: 'A verified mechanic reviews the AI report, confirms or corrects it, and fixes your car.',
  },
]

// TODO: point these at /login and /signup?role=... once the auth pages exist.
// For now each role goes straight to its dashboard so the shells can be browsed.
const roles = [
  {
    name: 'Customer',
    text: 'Register your cars, report problems, and track repairs and maintenance history.',
    to: '/customer',
  },
  {
    name: 'Mechanic',
    text: 'Receive service requests with an AI pre-report and confirm the diagnosis.',
    to: '/mechanic',
  },
  {
    name: 'Shop owner',
    text: 'Sell parts, accessories, motors and headlights to customers and mechanics.',
    to: '/shop',
  },
  {
    name: 'Tow company',
    text: 'Accept tow requests for your trucks and take cars to a mechanic or parts shop.',
    to: '/tow',
  },
]

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>Car trouble? Get a first diagnosis in minutes.</h1>
        <p className={styles.heroText}>
          FastFix connects you with mechanics, parts shops and tow trucks. Upload a photo, video or
          sound of the problem and get an AI preliminary diagnosis before a mechanic takes a look.
        </p>
        <div className={styles.heroActions}>
          <Button to="/customer">Report a car problem</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.card}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <h3 className={styles.cardTitle}>{step.title}</h3>
              <p className={styles.cardText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Join FastFix</h2>
        <ul className={styles.roles}>
          {roles.map((role) => (
            <li key={role.name} className={styles.card}>
              <h3 className={styles.cardTitle}>{role.name}</h3>
              <p className={styles.cardText}>{role.text}</p>
              <div className={styles.roleActions}>
                <Button to={role.to}>Sign up</Button>
                <Button to={role.to} variant="secondary">
                  Log in
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
