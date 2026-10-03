import Badge from '../../../components/Badge.jsx'
import { formatModel } from '../carModels.js'
import styles from './ViewerPlaceholder.module.css'

// TODO: replace with React Three Fiber viewer loading GLB files
// Where the 3D car will be rendered with the accessories on it. For now it says which model would
// be loaded (a ready model or the customer's scan, with its GLB file) and how many accessories are on it.
// `model`: { kind: 'ready', readyModel } | { kind: 'scanned', scan }
export default function ViewerPlaceholder({ model, partCount }) {
  const scanned = model.kind === 'scanned'
  const name = scanned
    ? `${model.scan.car.nickname ? `${model.scan.car.nickname}, ` : ''}${model.scan.car.make} ${model.scan.car.model} ${model.scan.car.year}`
    : formatModel(model.readyModel)
  const file = scanned ? model.scan.modelUrl : model.readyModel.glbUrl

  return (
    <div className={styles.viewer} role="img" aria-label={`3D viewer placeholder: ${scanned ? 'scanned' : 'ready'} model of ${name}`}>
      <Badge tone={scanned ? 'info' : 'success'}>{scanned ? 'Scanned model' : 'Ready model'}</Badge>
      <svg viewBox="0 0 64 32" className={styles.icon} aria-hidden="true">
        <path
          d="M6 22v-5l6-2 7-7h20l9 7 9 2v5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d="M21 15l4-5h12l6 5z" fill="currentColor" opacity="0.25" />
        <line x1="4" y1="22" x2="60" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="17" cy="23" r="5" fill="var(--color-surface)" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="47" cy="23" r="5" fill="var(--color-surface)" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <p className={styles.title}>{name}</p>
      <p className={styles.text}>
        3D viewer coming soon.{' '}
        {partCount === 0
          ? 'Add parts from the marketplace to see them here.'
          : `${partCount} ${partCount === 1 ? 'accessory' : 'accessories'} on the car.`}
      </p>
      <p className={styles.file}>
        Model file: <code>{file}</code>
      </p>
    </div>
  )
}
