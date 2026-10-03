import { ROLE_CHOICES } from './constants.js'
import styles from './RoleChoice.module.css'

// First signup screen: one card per account type.
export default function RoleChoice({ onChoose }) {
  return (
    <section className={styles.section} aria-labelledby="role-choice-title">
      <h2 id="role-choice-title" className={styles.title}>
        What kind of account do you need?
      </h2>
      <ul className={styles.cards}>
        {ROLE_CHOICES.map((choice) => (
          <li key={choice.role}>
            <button type="button" className={styles.card} onClick={() => onChoose(choice.role)}>
              <span className={styles.cardTitle}>{choice.title}</span>
              <span className={styles.cardText}>{choice.text}</span>
              <span className={choice.needsApproval ? styles.approval : styles.instant}>
                {choice.needsApproval ? 'Reviewed by an admin before you start' : 'Ready right away'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
