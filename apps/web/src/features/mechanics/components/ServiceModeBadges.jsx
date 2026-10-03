import { SERVICE_MODES } from '../../../auth/signup/constants.js'
import Badge from '../../../components/Badge.jsx'
import styles from './ServiceModeBadges.module.css'

const ICONS = { on_site: '🚗', workshop: '🔧', online: '💬' }

// The service modes a mechanic offers, in the SERVICE_MODES order. `highlight` marks the mode the
// directory is filtered by.
export default function ServiceModeBadges({ modes, highlight = '' }) {
  const offered = SERVICE_MODES.filter((mode) => modes.includes(mode.value))
  if (!offered.length) return null
  return (
    <ul className={styles.modes} aria-label="Services offered">
      {offered.map((mode) => (
        <li key={mode.value}>
          <Badge tone={mode.value === highlight ? 'accent' : 'info'}>
            <span aria-hidden="true">{ICONS[mode.value]}</span> {mode.label}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
