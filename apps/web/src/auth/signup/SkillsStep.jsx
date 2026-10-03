import Button from '../../components/Button.jsx'
import FileUpload from '../../components/FileUpload.jsx'
import { FieldError, TextField } from '../../components/FormField.jsx'
import { SKILLS } from './constants.js'
import { newSkill } from './listEntries.js'
import StepSection from './StepSection.jsx'
import styles from './SkillsStep.module.css'

// Mechanic step 3: pick skills, then give years of experience and a certificate for each one.
export default function SkillsStep({ form, setField, errors }) {
  const { skills } = form
  const isChosen = (skill) => skills.some((entry) => entry.skill === skill)

  const addSkill = (skill) => setField('skills', [...skills, newSkill(skill)])
  const removeSkill = (skill) => setField('skills', skills.filter((entry) => entry.skill !== skill))
  const updateSkill = (index, changes) =>
    setField(
      'skills',
      skills.map((entry, i) => (i === index ? { ...entry, ...changes } : entry)),
    )

  return (
    <StepSection
      title="Skills"
      intro="Choose the kinds of work you do. For each skill, add your years of experience and a certificate that proves it."
    >
      <fieldset
        id="skills"
        className={styles.picker}
        tabIndex={-1}
        aria-describedby={errors.skills ? 'skills-error' : undefined}
      >
        <legend className={styles.legend}>Your skills</legend>
        <div className={styles.chips}>
          {SKILLS.map((skill) => {
            const chosen = isChosen(skill)
            return (
              <button
                key={skill}
                type="button"
                className={chosen ? `${styles.chip} ${styles.chosen}` : styles.chip}
                aria-pressed={chosen}
                onClick={() => (chosen ? removeSkill(skill) : addSkill(skill))}
              >
                <span aria-hidden="true">{chosen ? '✓' : '+'}</span> {skill}
              </button>
            )
          })}
        </div>
        <FieldError id="skills-error">{errors.skills}</FieldError>
      </fieldset>

      {skills.length > 0 && (
        <ul className={styles.list}>
          {skills.map((entry, index) => (
            <li key={entry.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{entry.skill}</h3>
                <Button variant="secondary" onClick={() => removeSkill(entry.skill)}>
                  Remove
                </Button>
              </div>
              <TextField
                id={`skills.${index}.years`}
                label="Years of experience"
                type="number"
                inputMode="numeric"
                min="0"
                max="60"
                step="1"
                className={styles.years}
                value={entry.years}
                onChange={(event) => updateSkill(index, { years: event.target.value })}
                error={errors[`skills.${index}.years`]}
              />
              <FileUpload
                id={`skills.${index}.certificate`}
                label="Certificate"
                kind="document"
                value={entry.certificate}
                onChange={(file) => updateSkill(index, { certificate: file })}
                error={errors[`skills.${index}.certificate`]}
              />
            </li>
          ))}
        </ul>
      )}
    </StepSection>
  )
}
