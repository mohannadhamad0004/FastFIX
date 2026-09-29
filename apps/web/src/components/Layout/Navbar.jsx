import { Link, NavLink } from 'react-router'
import styles from './Navbar.module.css'

// TODO: once auth exists, show only the dashboard for the logged-in user's role.
const links = [
  { to: '/customer', label: 'Customer' },
  { to: '/mechanic', label: 'Mechanic' },
  { to: '/shop', label: 'Shop owner' },
  { to: '/tow', label: 'Tow' },
]

export default function Navbar() {
  return (
    <header className={styles.navbar}>
      <nav className={styles.inner}>
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
      </nav>
    </header>
  )
}
