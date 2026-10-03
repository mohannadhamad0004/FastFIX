import EmergencyButton from '../../requests/emergency/components/EmergencyButton.jsx'
import { TOW_SERVICES } from '../constants.js'
import LocationSearchHero from './LocationSearchHero.jsx'
import TowIcon from './TowIcon.jsx'
import Button from '../../../components/Button.jsx'
import styles from './TowSearchHero.module.css'

/**
 * The hero of /tow-companies: the shared search card plus the service filters and the emergency
 * button. Props are those of LocationSearchHero, plus:
 * @param {string} props.service      the chosen TOW_SERVICES value, or ''
 * @param {(service: string) => void} props.onServiceChange
 * @param {() => void} props.onEmergency  "Need a tow now?"
 */
export default function TowSearchHero({ service, onServiceChange, onEmergency, ...search }) {
  return (
    <LocationSearchHero
      title={
        <>
          Find a <span className={styles.accent}>tow truck</span> near you
        </>
      }
      subtitle="Verified tow companies, fast roadside help"
      idPrefix="tow-by"
      textMode={{ value: 'name', label: 'Company name' }}
      textLabel="Search tow companies by name"
      textPlaceholder="Company name, e.g. Nablus Rescue"
      {...search}
    >
      <EmergencyButton variant="large" />

      <div className={styles.services} role="group" aria-label="Filter by service">
        {TOW_SERVICES.map((item) => {
          const selected = service === item.value
          return (
            <button
              key={item.value}
              type="button"
              className={selected ? `${styles.service} ${styles.serviceSelected}` : styles.service}
              aria-pressed={selected}
              onClick={() => onServiceChange(selected ? '' : item.value)}
            >
              <TowIcon name={item.icon} size={18} />
              {item.label}
            </button>
          )
        })}
      </div>

      <Button variant="danger" size="lg" className={styles.emergency} onClick={onEmergency} disabled={search.locating}>
        <TowIcon name="locate" size={20} />
        Need a tow now? Use my location
      </Button>
    </LocationSearchHero>
  )
}
