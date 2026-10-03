import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import Drawer from '../../../components/Drawer.jsx'
import { useCart } from '../CartContext.js'
import { vehicleName } from '../format.js'
import VehiclePicker from './VehiclePicker.jsx'
import styles from './VehicleDrawer.module.css'

// "Select by make and model": choose the car to shop for. It is saved for the session (the cart
// keeps it), so every marketplace page shows only parts that fit it, the cart warns about parts that
// don't, and the 3D preview uses it. `vehicles` from getVehicleOptions(parts).
// `request`: { requireYear, reason, onChosen } from useVehicleDrawer(), or null when closed.
export default function VehicleDrawer({ request, vehicles, onClose }) {
  return (
    <Drawer open={Boolean(request)} title="Select your car" onClose={onClose}>
      {request && <VehicleForm request={request} vehicles={vehicles} onClose={onClose} />}
    </Drawer>
  )
}

function VehicleForm({ request, vehicles, onClose }) {
  const { vehicle, service } = useCart()
  const [draft, setDraft] = useState(vehicle)
  const complete = Boolean(draft?.make && (!request.requireYear || (draft.model && draft.year)))

  async function save(next) {
    await service.setVehicle(next)
    onClose()
    if (next) request.onChosen?.(next)
  }

  return (
    <div className={styles.form}>
      <p className={styles.intro}>
        {request.reason
          ? `Choose your make, model and year ${request.reason}.`
          : 'Choose your car and we only show parts that fit it. You can change it any time.'}
      </p>
      <VehiclePicker vehicle={draft} options={vehicles} onChange={setDraft} />
      {request.requireYear && !complete && draft?.make && <p className={styles.hint}>Choose the model and year too.</p>}
      <div className={styles.actions}>
        {vehicle && (
          <Button variant="ghost" onClick={() => save(null)}>
            Shop for all cars
          </Button>
        )}
        <Button disabled={!complete} onClick={() => save(draft)}>
          {draft?.make ? `Show parts for ${vehicleName(draft)}` : 'Show parts'}
        </Button>
      </div>
    </div>
  )
}
