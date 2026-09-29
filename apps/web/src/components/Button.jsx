import { Link } from 'react-router'
import styles from './Button.module.css'

// Shared button. Pass `to` to render a router link that looks like a button.
export default function Button({ to, variant = 'primary', className = '', ...props }) {
  const classes = `${styles.button} ${styles[variant]} ${className}`.trim()

  if (to) {
    return <Link to={to} className={classes} {...props} />
  }
  return <button type="button" className={classes} {...props} />
}
