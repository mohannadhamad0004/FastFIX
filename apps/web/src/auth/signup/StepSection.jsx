import styles from './StepSection.module.css'

// Heading, short intro and the fields of one signup step.
// The heading gets focus when the step changes, so screen readers announce the new step.
export default function StepSection({ title, intro, children }) {
  return (
    <section className={styles.section} aria-labelledby="signup-step-title">
      <header className={styles.header}>
        <h2 id="signup-step-title" className={styles.title} tabIndex={-1}>
          {title}
        </h2>
        {intro && <p className={styles.intro}>{intro}</p>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
