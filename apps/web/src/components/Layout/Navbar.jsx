import { Link, NavLink } from 'react-router'
import { useAuth } from '../../auth/useAuth.js'
import Button from '../Button.jsx'
import AccountMenu from './AccountMenu.jsx'
import styles from './Navbar.module.css'

// Public pages anyone can browse, logged in or not.
const links = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/mechanics', label: 'Mechanics' },
  { to: '/tow-companies', label: 'Tow Companies' },
]

// Public links on the left; on the right, Log in / Sign up or the account menu.
export default function Navbar() {
  const { user } = useAuth()

  return (
    <header className={styles.navbar}>
      <nav className={styles.inner} aria-label="Main">
        <div className={styles.left}>
          <Link to="/" className={styles.brand}>
            FastFix
          </Link>
          <ul className={styles.links}>
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.account}>
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <Link to="/login" className={styles.link}>
                Log in
              </Link>
              <Button to="/signup">Sign up</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
