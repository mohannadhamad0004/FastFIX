import Button from '../../../components/Button.jsx'
import { TextField } from '../../../components/FormField.jsx'
import Notice from '../../../components/Notice.jsx'
import { useGeolocation } from '../useGeolocation.js'
import PickupMap from './PickupMap.jsx'
import TowIcon from './TowIcon.jsx'
import styles from './PickupField.module.css'

/**
 * Where the car is, in a tow request: a pin on a small map (from "Use my location" or placed by
 * hand, then dragged to adjust) and a text field for a landmark or address. Whatever is on the map
 * when the form is sent is the location the customer confirmed; nothing is saved before that.
 * @param {Object} props
 * @param {{ lat: number, lng: number } | null} props.position
 * @param {(position: { lat: number, lng: number } | null) => void} props.onPositionChange
 * @param {{ lat: number, lng: number } | null} props.startAt  where "Place the pin on the map" starts (the company's base)
 * @param {string} props.notes
 * @param {(notes: string) => void} props.onNotesChange
 * @param {string} [props.error]
 */
export default function PickupField({ position, onPositionChange, startAt, notes, onNotesChange, error }) {
  const geo = useGeolocation()
  const locating = geo.status === 'locating'

  async function useMyLocation() {
    const found = await geo.locate()
    if (found) onPositionChange(found)
  }

  return (
    <fieldset className={styles.field}>
      <legend className={styles.legend}>Pickup location</legend>

      {position ? (
        <>
          <PickupMap position={position} onChange={onPositionChange} />
          <p className={styles.hint}>Drag the pin (or tap the map) to the exact spot. This location is sent with your request.</p>
        </>
      ) : (
        <p className={styles.hint}>Share your location or place a pin so the driver can find you.</p>
      )}

      <div className={styles.buttons}>
        <Button variant="secondary" onClick={useMyLocation} loading={locating}>
          {!locating && <TowIcon name="locate" size={18} />}
          {locating ? 'Finding your location…' : position ? 'Use my location again' : 'Use my location'}
        </Button>
        {!position && startAt && (
          <Button variant="ghost" onClick={() => onPositionChange(startAt)}>
            <TowIcon name="pin" size={18} />
            Place the pin on the map
          </Button>
        )}
        {position && (
          <Button variant="ghost" onClick={() => onPositionChange(null)}>
            Remove the pin
          </Button>
        )}
      </div>
      {geo.status === 'error' && <Notice tone="warning">{geo.error}</Notice>}

      <TextField
        id="pickup"
        label="Landmark or address notes"
        optional={Boolean(position)}
        hint="Street, landmark or highway exit, e.g. City Mall parking, gate 3."
        autoComplete="street-address"
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        error={error}
      />
    </fieldset>
  )
}
