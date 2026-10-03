import Button from '../../../components/Button.jsx'
import Notice from '../../../components/Notice.jsx'
import { closestModels, findReadyModel, formatModel } from '../carModels.js'
import { formatPreviewCar } from '../fitment.js'
import { usePreview3D } from '../Preview3DContext.js'
import CarPicker from './CarPicker.jsx'
import PreviewWorkspace from './PreviewWorkspace.jsx'
import styles from './Preview3DDrawer.module.css'

// "Use a ready model": the car from the vehicle picker. When we have a ready model for that make,
// model and year it opens; otherwise we say so and offer the closest models we do have, or scanning.
// `vehicles` from getVehicleOptions(parts).
export default function ReadyModelStep({ vehicles }) {
  const { car, setCar, readyModel, usingClosestModel, chooseClosestModel, chooseSource } = usePreview3D()
  const exact = findReadyModel(car)

  return (
    <div className={styles.step}>
      <CarPicker vehicles={vehicles} car={car} onChange={setCar} />

      {car && !exact && (
        <Notice tone="warning" title="We don't have a 3D model for this car yet">
          <p>
            There&apos;s no ready model for a {formatPreviewCar(car)}. You can try parts on the closest model we have, or scan your own
            car.
          </p>
          <ul className={styles.suggestions}>
            {closestModels(car).map(({ model, reason }) => (
              <li key={model.id}>
                <span>
                  <strong>{formatModel(model)}</strong> <span className={styles.muted}>· {reason}</span>
                </span>
                <Button
                  size="sm"
                  variant={readyModel?.id === model.id ? 'primary' : 'secondary'}
                  aria-pressed={readyModel?.id === model.id}
                  onClick={() => chooseClosestModel(model.id)}
                >
                  {readyModel?.id === model.id ? '✓ Showing' : 'Use this model'}
                </Button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" onClick={() => chooseSource('scan')}>
            Scan my own car instead
          </Button>
        </Notice>
      )}

      {car && exact && (
        <p className={styles.loaded}>
          ✓ Ready model found: <strong>{formatModel(exact)}</strong>
        </p>
      )}
      {usingClosestModel && readyModel && (
        <p className={styles.muted}>
          Showing a {formatModel(readyModel)} instead of your {formatPreviewCar(car)}: shapes and sizes may differ a little.
        </p>
      )}

      {car && readyModel && <PreviewWorkspace model={{ kind: 'ready', readyModel }} />}
      {!car && <p className={styles.muted}>Choose your car to load its 3D model.</p>}
    </div>
  )
}
