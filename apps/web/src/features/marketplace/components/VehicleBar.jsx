import Button from '../../../components/Button.jsx'
import { useCart } from '../CartContext.js'
import { vehicleName } from '../format.js'
import { useVehicleDrawer } from '../VehicleDrawerContext.js'
import CatalogIcon from './CatalogIcon.jsx'
import styles from './VehicleBar.module.css'

// The active vehicle above results: "Showing parts for Hyundai Accent 2016 · Change · Clear", or a
// prompt to choose one.
export default function VehicleBar() {
  const { vehicle, service } = useCart()
  const openVehicleDrawer = useVehicleDrawer()

  return (
    <div className={`${styles.bar} ${vehicle ? styles.active : ''}`} role="status">
      <CatalogIcon name="car" size={22} className={styles.icon} />
      {vehicle ? (
        <p className={styles.text}>
          <strong>{vehicleName(vehicle)}</strong> · Showing parts compatible with your vehicle.
        </p>
      ) : (
        <p className={styles.text}>Showing parts for all cars. Choose yours to see only parts that fit.</p>
      )}
      <div className={styles.actions}>
        <Button size="sm" variant="secondary" onClick={() => openVehicleDrawer?.()}>
          {vehicle ? 'Change' : 'Select your car'}
        </Button>
        {vehicle && (
          <Button size="sm" variant="ghost" onClick={() => service.setVehicle(null)}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
