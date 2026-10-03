import { SERVICE_MODES, SKILLS } from '../../../auth/signup/constants.js'
import Button from '../../../components/Button.jsx'
import Select from '../../../components/Select.jsx'
import styles from './MechanicFilters.module.css'

/**
 * Skill, service and car make filters above the results. "Clear filters" appears when one is set.
 * @param {{ skill: string, serviceMode: string, make: string, makes: string[],
 *           onChange: (key: 'skill' | 'mode' | 'make', value: string) => void, onClear: () => void }} props
 */
export default function MechanicFilters({ skill, serviceMode, make, makes, onChange, onClear }) {
  return (
    <div className={styles.filters} role="group" aria-label="Filter mechanics">
      <label className={styles.filter}>
        <span className={styles.label}>Specialty</span>
        <Select size="sm" value={skill} onChange={(event) => onChange('skill', event.target.value)}>
          <option value="">All specialties</option>
          {SKILLS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </label>
      <label className={styles.filter}>
        <span className={styles.label}>Service type</span>
        <Select size="sm" value={serviceMode} onChange={(event) => onChange('mode', event.target.value)}>
          <option value="">Any service</option>
          {SERVICE_MODES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>
      <label className={styles.filter}>
        <span className={styles.label}>Car make</span>
        <Select size="sm" value={make} onChange={(event) => onChange('make', event.target.value)}>
          <option value="">Any make</option>
          {makes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </label>
      {(skill || serviceMode || make) && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
