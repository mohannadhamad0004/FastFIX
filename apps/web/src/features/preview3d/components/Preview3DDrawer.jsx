import Button from '../../../components/Button.jsx'
import Drawer from '../../../components/Drawer.jsx'
import { usePreview3D } from '../Preview3DContext.js'
import ModelChoice from './ModelChoice.jsx'
import ReadyModelStep from './ReadyModelStep.jsx'
import ScanStep from './ScanStep.jsx'
import styles from './Preview3DDrawer.module.css'

// TODO: replace with React Three Fiber viewer loading GLB files
// "View on my car in 3D". First asks how to get the car model (ModelChoice):
//   ready model -> ReadyModelStep: the car from the vehicle picker, its ready model (or the closest)
//   scan        -> ScanStep: upload photos or a video of one of the customer's cars, then use it
// Both end in PreviewWorkspace: the accessories, the total and the viewer placeholder.
// `vehicles` from getVehicleOptions(parts).
export default function Preview3DDrawer({ vehicles }) {
  const { source, isOpen, chooseSource, close } = usePreview3D()

  return (
    <Drawer open={isOpen} title="View on my car in 3D" onClose={close}>
      <div className={styles.content}>
        {source === null ? (
          <ModelChoice onChoose={chooseSource} />
        ) : (
          <>
            <div className={styles.sourceBar}>
              <p className={styles.sourceText}>
                {source === 'ready' ? 'Using a ready model' : 'Using a scan of your car (beta)'}
              </p>
              <Button variant="ghost" size="sm" onClick={() => chooseSource(null)}>
                Change how I get my model
              </Button>
            </div>
            {source === 'ready' ? <ReadyModelStep vehicles={vehicles} /> : <ScanStep />}
          </>
        )}
      </div>
    </Drawer>
  )
}
