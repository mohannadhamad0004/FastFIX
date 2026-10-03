import Button from '../../../components/Button.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { anchorLabel } from '../attachmentPoints.js'
import { getAccessoryData } from '../accessoryData.js'
import { fitsCar, isPreviewable } from '../fitment.js'
import { usePreview3D } from '../Preview3DContext.js'

// "Add to 3D preview" on a part card. Only shown for Lighting, Body, Accessories and Tires & Wheels
// parts that fit the car chosen in the 3D preview drawer. Clicking again removes it. On a ready
// model a part takes its attachment point, so it replaces a part already there (toast says which).
export default function AddToPreviewButton({ part }) {
  const { car, isSelected, addPart, removePart } = usePreview3D()
  const toast = useToast()
  if (!isPreviewable(part) || !fitsCar(part, car)) return null

  const selected = isSelected(part.id)

  function handleClick() {
    if (selected) {
      removePart(part.id)
      return
    }
    const replaced = addPart(part)
    if (replaced) {
      toast.info(`“${part.name}” replaced “${replaced.name}” on the ${anchorLabel(getAccessoryData(part).attachmentAnchor).toLowerCase()}.`)
    }
  }

  return (
    <Button variant="secondary" aria-pressed={selected} onClick={handleClick}>
      {selected ? '✓ In 3D preview' : 'Add to 3D preview'}
    </Button>
  )
}
