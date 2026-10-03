import { Link } from 'react-router'
import Button from '../../../components/Button.jsx'
import Card from '../../../components/Card.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import { SkeletonRows } from '../../../components/Skeleton.jsx'
import StatusBadge from '../../../components/StatusBadge.jsx'
import { formatDate } from '../../../utils/formatDate.js'
import { formatPrice } from '../format.js'
import { orderStatusBadge } from '../orderConstants.js'
import { useOrdersQuery } from '../OrdersContext.js'
import styles from './OrdersPage.module.css'

const loadOrders = (service) => service.getMyOrders()

// /orders - "My Orders" for customers and mechanics: one row per order (one per shop), newest
// first, with the checkout number it belongs to.
export default function OrdersPage() {
  const { data: orders, error } = useOrdersQuery(loadOrders)

  if (error) return <EmptyState icon="⚠" title="Couldn't load your orders" description={error.message} />

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My orders</h1>

      {!orders ? (
        <SkeletonRows rows={3} label="Loading your orders…" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="Parts you buy in the marketplace will show up here."
          action={<Button to="/marketplace">Browse parts</Button>}
        />
      ) : (
        <ul className={styles.list}>
          {orders.map((order) => {
            const badge = orderStatusBadge(order.status)
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
            return (
              <li key={order.id}>
                <Card as="article" interactive className={styles.order}>
                  <div className={styles.top}>
                    <p className={styles.number}>
                      <Link to={`/orders/${order.id}`} className={Card.cover}>
                        Checkout {order.checkoutNumber}
                      </Link>
                    </p>
                    <StatusBadge label={badge.label} tone={badge.tone} />
                  </div>
                  <p className={styles.shop}>{order.shopName}</p>
                  <div className={styles.bottom}>
                    <span className={styles.muted}>
                      {formatDate(order.createdAt)} · {itemCount} {itemCount === 1 ? 'item' : 'items'}
                    </span>
                    <strong>{formatPrice(order.totalIls)}</strong>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
