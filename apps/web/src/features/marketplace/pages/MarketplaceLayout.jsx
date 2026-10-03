import { useCallback, useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import Preview3DDrawer from '../../preview3d/components/Preview3DDrawer.jsx'
import Preview3DLauncher from '../../preview3d/components/Preview3DLauncher.jsx'
import CartLinks from '../components/CartLinks.jsx'
import VehicleDrawer from '../components/VehicleDrawer.jsx'
import { getVehicleOptions } from '../filters.js'
import { useMarketplaceData } from '../useMarketplaceData.js'
import { VehicleDrawerContext } from '../VehicleDrawerContext.js'
import styles from './MarketplaceLayout.module.css'

// Wraps every /marketplace page: Saved parts and Cart links on top, the VehicleDrawer (any page
// opens it with useVehicleDrawer), and the 3D preview launcher and drawer.
export default function MarketplaceLayout() {
  const { parts } = useMarketplaceData()
  const vehicles = useMemo(() => getVehicleOptions(parts), [parts])
  const [vehicleRequest, setVehicleRequest] = useState(null)
  const openVehicleDrawer = useCallback((options = {}) => setVehicleRequest(options), [])

  return (
    <VehicleDrawerContext value={openVehicleDrawer}>
      <div className={styles.layout}>
        <div className={styles.topBar}>
          <CartLinks />
        </div>
        <Outlet />
      </div>
      <VehicleDrawer request={vehicleRequest} vehicles={vehicles} onClose={() => setVehicleRequest(null)} />
      <Preview3DLauncher />
      <Preview3DDrawer vehicles={vehicles} />
    </VehicleDrawerContext>
  )
}
