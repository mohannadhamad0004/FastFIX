import Button from '../../../components/Button.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { getAccessoryData } from '../../preview3d/accessoryData.js'
import { anchorLabel } from '../../preview3d/attachmentPoints.js'
import { fitsCar, isPreviewable } from '../../preview3d/fitment.js'
import { usePreview3D } from '../../preview3d/Preview3DContext.js'
import { useCart } from '../CartContext.js'
import { vehicleName } from '../format.js'
import { useVehicleDrawer } from '../VehicleDrawerContext.js'
import CatalogIcon from './CatalogIcon.jsx'

// "View on my 3D car" for parts the 3D preview supports (lighting, body, accessories, tires and
// wheels). It uses the selected vehicle: with none (or without a model and year), the VehicleDrawer
// opens first, then the 3D preview with this part on the car. The selection is the same one the
// preview drawer shows (Preview3DProvider).
export default function View3DButton({ part, size = 'md', fullWidth = false }) {
  const preview = usePreview3D()
  const { vehicle } = useCart()
  const openVehicleDrawer = useVehicleDrawer()
  const toast = useToast()
  if (!isPreviewable(part)) return null

  const selected = preview.isSelected(part.id)

  function showOn(car) {
    const previewCar = { make: car.make, model: car.model, year: Number(car.year) }
    if (!fitsCar(part, previewCar)) {
      toast.warning(`“${part.name}” doesn't fit a ${vehicleName(car)}, so it can't go on your car in 3D.`)
      return
    }
    preview.setCar(previewCar)
    const replaced = preview.addPart(part)
    if (replaced) {
      const anchor = getAccessoryData(part).attachmentAnchor
      toast.info(`“${part.name}” replaced “${replaced.name}”${anchor ? ` on the ${anchorLabel(anchor).toLowerCase()}` : ''}.`)
    }
    preview.open()
  }

  function handleClick() {
    if (selected) {
      preview.open()
      return
    }
    if (vehicle?.make && vehicle.model && vehicle.year) {
      showOn(vehicle)
      return
    }
    if (!openVehicleDrawer) {
      toast.info('Choose your car in the marketplace first.')
      return
    }
    openVehicleDrawer({ requireYear: true, reason: 'to see this part on it in 3D', onChosen: showOn })
  }

  return (
    <Button variant="secondary" size={size} fullWidth={fullWidth} onClick={handleClick} aria-label={`View ${part.name} on my 3D car`}>
      <CatalogIcon name="cube" size={18} />
      {selected ? 'In 3D preview' : 'View on my 3D car'}
    </Button>
  )
}
