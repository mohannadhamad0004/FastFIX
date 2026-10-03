import { useState } from 'react'
import Button from '../../../components/Button.jsx'
import Notice from '../../../components/Notice.jsx'
import { formatPrice } from '../../marketplace/format.js'
import { getAccessoryData } from '../accessoryData.js'
import { anchorLabel, ATTACHMENT_ANCHORS } from '../attachmentPoints.js'
import { fitsCar, formatPreviewCar, PREVIEW_CATEGORIES } from '../fitment.js'
import { usePreview3D } from '../Preview3DContext.js'
import AccessoryControls from './AccessoryControls.jsx'
import AskShopsButton from './AskShopsButton.jsx'
import ViewerPlaceholder from './ViewerPlaceholder.jsx'
import styles from './PreviewWorkspace.module.css'

// The loaded car model with its accessories: the list (with remove, and on scanned cars the
// move / rotate / resize controls), the total price, Reset, Screenshot (not yet) and "Ask the shop",
// next to the viewer placeholder.
//   ready model:   accessories snap to named attachment points; wheels and lights replace the originals
//   scanned model: accessories are added on top and placed by hand
// `model`: { kind: 'ready', readyModel } | { kind: 'scanned', scan }
export default function PreviewWorkspace({ model }) {
  const { car, items, transforms, removePart, updateTransform, resetPreview } = usePreview3D()
  const [adjustingId, setAdjustingId] = useState(null)
  const scanned = model.kind === 'scanned'
  const total = items.reduce((sum, part) => sum + part.priceIls, 0)

  function placementText(part) {
    if (scanned) return 'Placed by hand on your scan'
    const { placementType, attachmentAnchor } = getAccessoryData(part)
    if (placementType !== 'anchor') return 'No fixed spot: added on top of the car'
    const anchor = ATTACHMENT_ANCHORS[attachmentAnchor]
    return anchor.replacesOriginal
      ? `${anchor.label}: replaces the original ${anchor.label.toLowerCase()}`
      : `Snaps to: ${anchorLabel(attachmentAnchor).toLowerCase()}`
  }

  return (
    <div className={styles.split}>
      <section className={styles.selected} aria-labelledby="preview-selected-title">
        <h3 id="preview-selected-title" className={styles.sectionTitle}>
          Accessories on the car ({items.length})
        </h3>

        {scanned ? (
          <Notice tone="info">
            On a scanned car, accessories are added on top: original parts can&apos;t be removed. Use Adjust to move, rotate and resize
            each one.
          </Notice>
        ) : (
          <p className={styles.muted}>Parts snap to their spot on the car. New wheels and lights replace the originals.</p>
        )}

        {items.length === 0 ? (
          <p className={styles.muted}>
            {car
              ? `Close this panel and use "Add to 3D preview" on a part that fits your ${formatPreviewCar(car)}.`
              : 'Choose your car first.'}{' '}
            Works for {PREVIEW_CATEGORIES.join(', ')}.
          </p>
        ) : (
          <ul className={styles.list}>
            {items.map((part) => (
              <li key={part.id} className={styles.item}>
                <div className={styles.itemRow}>
                  <div className={styles.itemText}>
                    <span className={styles.itemName}>{part.name}</span>
                    <span className={styles.muted}>
                      {part.category} · {formatPrice(part.priceIls)}
                    </span>
                    <span className={styles.placement}>{placementText(part)}</span>
                    {car && !fitsCar(part, car) && <span className={styles.warning}>Doesn&apos;t fit a {formatPreviewCar(car)}</span>}
                  </div>
                  <div className={styles.itemActions}>
                    {scanned && (
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-expanded={adjustingId === part.id}
                        onClick={() => setAdjustingId((id) => (id === part.id ? null : part.id))}
                      >
                        Adjust
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removePart(part.id)}
                      aria-label={`Remove ${part.name} from the 3D preview`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
                {scanned && adjustingId === part.id && transforms[part.id] && (
                  <AccessoryControls part={part} transform={transforms[part.id]} onChange={(changes) => updateTransform(part.id, changes)} />
                )}
              </li>
            ))}
          </ul>
        )}

        <p className={styles.total}>
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </p>

        <div className={styles.buttons}>
          <Button
            variant="ghost"
            disabled={items.length === 0}
            onClick={() => {
              setAdjustingId(null)
              resetPreview()
            }}
          >
            Reset
          </Button>
          <Button variant="ghost" disabled title="Coming with the 3D viewer">
            Take a screenshot
          </Button>
          <AskShopsButton parts={items} car={car} />
        </div>
      </section>

      <ViewerPlaceholder model={model} partCount={items.length} />
    </div>
  )
}
