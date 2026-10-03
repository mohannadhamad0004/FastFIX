import { Link } from 'react-router'
import Button from '../../../components/Button.jsx'
import Card from '../../../components/Card.jsx'
import { describeChange } from '../cartService.js'
import { formatPrice } from '../format.js'
import QuantityStepper from './QuantityStepper.jsx'
import styles from './CartGroupCard.module.css'

// One shop's items in the cart: each line with image, name, part number, price, quantity (up to
// the stock) and remove, then the shop's subtotal. A line warns when it doesn't fit the selected
// vehicle or changed since it was added. Each shop becomes a separate order at checkout.
export default function CartGroupCard({ group, onQuantity, onRemove }) {
  const { shop, lines, subtotalIls } = group
  return (
    <Card as="section" padding="none" aria-labelledby={`cart-shop-${shop.id}`}>
      <header className={styles.header}>
        <h2 id={`cart-shop-${shop.id}`} className={styles.shop}>
          <Link to={`/shops/${shop.id}`}>{shop.name}</Link>
        </h2>
        <span className={styles.city}>{shop.city}</span>
      </header>

      <ul className={styles.lines}>
        {lines.map(({ part, quantity, lineTotalIls, changes, fits }) => (
          <li key={part.id} className={styles.line}>
            {/* TODO: real part photo */}
            <div className={styles.image} aria-hidden="true">
              {part.category}
            </div>

            <div className={styles.details}>
              <p className={styles.name}>
                <Link to={`/marketplace/part/${part.id}`}>{part.name}</Link>
              </p>
              <p className={styles.meta}>
                {part.brand} · Part no. <span className={styles.number}>{part.oemNumber || part.manufacturerNumber}</span>
              </p>
              <p className={styles.price}>{formatPrice(part.priceIls)} each</p>

              {!fits && (
                <p className={styles.warning} role="alert">
                  ⚠ May not fit your selected vehicle. Check the compatible vehicles.
                </p>
              )}
              {changes.map((change) => (
                <p key={change.type} className={styles.warning}>
                  ⚠ {describeChange(part.name, change)}
                </p>
              ))}
            </div>

            <div className={styles.controls}>
              <QuantityStepper
                value={quantity}
                max={Math.max(part.stock, 1)}
                name={part.name}
                disabled={part.stock === 0}
                onChange={(next) => onQuantity(part.id, next)}
              />
              <p className={styles.stock}>{part.stock === 0 ? 'Out of stock' : `${part.stock} in stock`}</p>
              <p className={styles.lineTotal}>{formatPrice(lineTotalIls)}</p>
              <Button variant="ghost" size="sm" onClick={() => onRemove(part.id)} aria-label={`Remove ${part.name} from cart`}>
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <footer className={styles.footer}>
        <span>Subtotal from {shop.name}</span>
        <strong>{formatPrice(subtotalIls)}</strong>
      </footer>
    </Card>
  )
}
