import Button from '../../../components/Button.jsx'
import { usePreview3D } from '../../preview3d/Preview3DContext.js'
import { useCart } from '../CartContext.js'
import { useVehicleDrawer } from '../VehicleDrawerContext.js'
import CatalogIcon from './CatalogIcon.jsx'
import styles from './Preview3DBanner.module.css'

// "See accessories on your car in 3D", at the top of the Accessories & equipment group. Opens the
// 3D preview drawer (placeholder viewer, same selection as the parts' "View on my 3D car"). With no
// car chosen yet, the VehicleDrawer opens first.
export default function Preview3DBanner() {
  const preview = usePreview3D()
  const { vehicle } = useCart()
  const openVehicleDrawer = useVehicleDrawer()

  function openOn(car) {
    preview.setCar({ make: car.make, model: car.model, year: Number(car.year) })
    preview.open()
  }

  function handleClick() {
    if (vehicle?.make && vehicle.model && vehicle.year) openOn(vehicle)
    else openVehicleDrawer?.({ requireYear: true, reason: 'to see accessories on it in 3D', onChosen: openOn })
  }

  return (
    <section className={styles.banner} aria-labelledby="preview3d-banner-title">
      <CatalogIcon name="cube" size={56} className={styles.icon} />
      <div className={styles.text}>
        <h2 id="preview3d-banner-title" className={styles.title}>
          See accessories on your car in 3D
        </h2>
        <p className={styles.subtitle}>Try roof bars, spoilers, lights and wheels on your own car before you buy.</p>
      </div>
      <Button size="lg" onClick={handleClick}>
        Open the 3D preview
      </Button>
    </section>
  )
}
