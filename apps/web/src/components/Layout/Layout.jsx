import { Outlet, useLocation } from 'react-router'
import EmergencyOverlay from '../../features/requests/emergency/components/EmergencyOverlay.jsx'
import Navbar from './Navbar.jsx'
import { isWidePath } from './wideRoutes.js'
import styles from './Layout.module.css'

// Page wrapper shared by every route: navbar on top, the current page below.
export default function Layout() {
  const { pathname } = useLocation()
  return (
    <>
      <Navbar />
      <main className={styles.main} data-wide={isWidePath(pathname) || undefined}>
        <Outlet />
      </main>
      <EmergencyOverlay />
    </>
  )
}
