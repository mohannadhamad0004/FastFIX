import { useState } from 'react'
import { useLocation } from 'react-router'
import { loginPathFor } from '../../../auth/redirect.js'
import { useAuth } from '../../../auth/useAuth.js'
import { ROLES } from '../../../authorization/roles.js'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import { useToast } from '../../../components/Toast/ToastContext.js'
import { useMyCars } from '../../cars/useMyCars.js'
import { usePreview3D } from '../Preview3DContext.js'
import { SCAN_STATUS } from '../scanConstants.js'
import { useScans } from '../ScansContext.js'
import PreviewWorkspace from './PreviewWorkspace.jsx'
import ScanStatusCard from './ScanStatusCard.jsx'
import ScanUploadForm from './ScanUploadForm.jsx'
import styles from './Preview3DDrawer.module.css'

// "Scan my own car (beta)": what scanning involves, the customer's scans with their status, a new
// scan (ScanUploadForm), and the loaded scanned model with its accessories once one is ready.
// Scans belong to cars in My Cars, so this is for customers.
export default function ScanStep() {
  const { user } = useAuth()
  const location = useLocation()
  const toast = useToast()
  const { scans, service } = useScans()
  const { cars, loading } = useMyCars()
  const { scanId, scanCarId, selectScan } = usePreview3D()
  // Open the upload form right away when coming from a car in My Cars, or when there are no scans yet.
  const [creating, setCreating] = useState(Boolean(scanCarId))

  const explainer = (
    <div className={styles.explainer}>
      <p>
        <Badge tone="info">Beta</Badge> Take photos all around your car (or a 360° video). Building your 3D model takes a few minutes,
        and we notify you when it&apos;s ready. On a scanned car, you place accessories by hand.
      </p>
    </div>
  )

  if (!user) {
    return (
      <div className={styles.step}>
        {explainer}
        <Notice tone="info" title="Log in to scan your car">
          <p>Scans are saved with your cars in My Cars.</p>
          <Button to={loginPathFor(location)} size="sm">
            Log in
          </Button>
        </Notice>
      </div>
    )
  }
  if (user.role !== ROLES.CUSTOMER) {
    return (
      <div className={styles.step}>
        {explainer}
        <Notice tone="info">Scanning is for customer accounts: the model is saved with your car in My Cars.</Notice>
      </div>
    )
  }
  if (loading && cars.length === 0) return <SkeletonRows rows={3} label="Loading your cars…" />
  if (cars.length === 0) {
    return (
      <div className={styles.step}>
        {explainer}
        <Notice tone="info" title="Add your car first">
          <p>Your scan is saved under one of your cars, so add it to My Cars before you scan.</p>
          <Button to="/my-cars" size="sm">
            Go to My Cars
          </Button>
        </Notice>
      </div>
    )
  }

  const selected = scans.find((scan) => scan.id === scanId) ?? null
  const showForm = creating || scans.length === 0

  async function handleDelete(scan) {
    try {
      await service.deleteScan(scan.id)
      if (scan.id === scanId) selectScan(null)
      toast.success('Scan deleted.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className={styles.step}>
      {explainer}

      {showForm ? (
        <ScanUploadForm
          cars={cars}
          initialCarId={scanCarId}
          onCancel={() => setCreating(false)}
          onDone={(scan) => {
            setCreating(false)
            selectScan(scan)
            toast.success('Uploaded. We’re building your 3D model now.')
          }}
        />
      ) : (
        <>
          <div className={styles.listHeader}>
            <h3 className={styles.sectionTitle}>Your scans</h3>
            <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
              + Scan a car
            </Button>
          </div>
          <ul className={styles.scanList}>
            {scans.map((scan) => (
              <li key={scan.id}>
                <ScanStatusCard scan={scan} active={scan.id === scanId} onUse={selectScan} onDelete={handleDelete} />
              </li>
            ))}
          </ul>
        </>
      )}

      {selected?.status === SCAN_STATUS.READY && !showForm && <PreviewWorkspace model={{ kind: 'scanned', scan: selected }} />}
    </div>
  )
}
