import { useAuth } from '../../../auth/useAuth.js'
import { usePermission } from '../../../authorization/usePermission.js'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import { BUY_PERMISSION } from '../cartService.js'
import { useCart } from '../CartContext.js'
import styles from './CartLinks.module.css'

// "Saved parts" and the cart icon with its item count, for the marketplace header. Customers,
// mechanics and visitors see them (visitors are asked to log in on the page they open); other
// roles can't buy, so they see nothing.
export default function CartLinks() {
  const { user } = useAuth()
  const canBuy = usePermission(BUY_PERMISSION)
  const { count, savedIds } = useCart()
  if (user && !canBuy) return null

  return (
    <nav className={styles.links} aria-label="Cart and saved parts">
      <Button
        to="/saved-parts"
        variant="secondary"
        size="sm"
        aria-label={savedIds.length ? `Saved parts, ${savedIds.length} saved` : 'Saved parts'}
      >
        <span aria-hidden="true">♡</span> Saved parts
        {savedIds.length > 0 && <Badge>{savedIds.length}</Badge>}
      </Button>
      <Button to="/cart" variant="secondary" size="sm" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="20" r="1.5" />
          <circle cx="18" cy="20" r="1.5" />
          <path d="M2 3h3l2.6 12.3a1 1 0 0 0 1 .7h9.2a1 1 0 0 0 1-.8L20.5 8H6" />
        </svg>
        Cart
        {count > 0 && <Badge tone="accent">{count}</Badge>}
      </Button>
    </nav>
  )
}
