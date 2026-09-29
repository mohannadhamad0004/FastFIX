import { Outlet } from 'react-router'
import Navbar from './Navbar.jsx'
import styles from './Layout.module.css'

// Page wrapper shared by every route: navbar on top, the current page below.
export default function Layout() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </>
  )
}
