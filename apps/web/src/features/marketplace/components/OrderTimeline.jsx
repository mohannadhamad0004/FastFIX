import { formatDateTime } from '../../requests/format.js'
import { ORDER_FLOWS, ORDER_STATUS, orderStatusBadge } from '../orderConstants.js'
import styles from './OrderTimeline.module.css'

// Where an order is: Placed → Confirmed → Preparing → Out for delivery / Ready for pickup →
// Delivered / Picked up → Completed. Steps already reached show their time; the current step is
// marked; a cancelled order shows the steps it reached, then "Cancelled" with the reason.
export default function OrderTimeline({ order }) {
  const reached = new Map(order.timeline.map((entry) => [entry.status, entry.at]))
  const cancelled = order.status === ORDER_STATUS.CANCELLED
  const flow = ORDER_FLOWS[order.fulfillment.method]
  const steps = cancelled ? order.timeline.map((entry) => entry.status) : flow

  return (
    <ol className={styles.timeline} aria-label="Order status">
      {steps.map((status) => {
        const at = reached.get(status)
        const isCurrent = status === order.status
        const isCancelStep = status === ORDER_STATUS.CANCELLED
        const state = isCancelStep ? styles.cancelled : isCurrent ? styles.current : at ? styles.done : styles.upcoming
        return (
          <li key={status} className={`${styles.step} ${state}`} aria-current={isCurrent ? 'step' : undefined}>
            <span className={styles.marker} aria-hidden="true">
              {isCancelStep ? '✕' : at && !isCurrent ? '✓' : ''}
            </span>
            <div>
              <p className={styles.label}>{orderStatusBadge(status).label}</p>
              {at && <p className={styles.time}>{formatDateTime(at)}</p>}
              {isCancelStep && order.cancellation && <p className={styles.reason}>Reason: {order.cancellation.reason}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
