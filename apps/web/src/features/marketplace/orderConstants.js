import { FULFILLMENT_METHODS } from './shopCommerce.js'

export const ORDER_STATUS = Object.freeze({
  PLACED: 'placed',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  READY_FOR_PICKUP: 'ready_for_pickup',
  DELIVERED: 'delivered',
  PICKED_UP: 'picked_up',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
})

// The steps of an order, in order. The shop moves it along; only a PLACED order can be cancelled.
export const ORDER_FLOWS = Object.freeze({
  [FULFILLMENT_METHODS.DELIVERY]: [
    ORDER_STATUS.PLACED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
  ],
  [FULFILLMENT_METHODS.PICKUP]: [
    ORDER_STATUS.PLACED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.READY_FOR_PICKUP,
    ORDER_STATUS.PICKED_UP,
    ORDER_STATUS.COMPLETED,
  ],
})

export const ORDER_STATUS_BADGES = Object.freeze({
  [ORDER_STATUS.PLACED]: { label: 'Placed', tone: 'warning' },
  [ORDER_STATUS.CONFIRMED]: { label: 'Confirmed', tone: 'info' },
  [ORDER_STATUS.PREPARING]: { label: 'Preparing', tone: 'info' },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: { label: 'Out for delivery', tone: 'info' },
  [ORDER_STATUS.READY_FOR_PICKUP]: { label: 'Ready for pickup', tone: 'info' },
  [ORDER_STATUS.DELIVERED]: { label: 'Delivered', tone: 'success' },
  [ORDER_STATUS.PICKED_UP]: { label: 'Picked up', tone: 'success' },
  [ORDER_STATUS.COMPLETED]: { label: 'Completed', tone: 'success' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', tone: 'danger' },
})

export const orderStatusBadge = (status) => ORDER_STATUS_BADGES[status] ?? { label: status, tone: 'neutral' }

export const PAYMENT_STATUS_LABELS = Object.freeze({
  unpaid: 'Not paid yet',
  paid: 'Paid',
  refunded: 'Refund issued',
})

// The tabs on /parts-shop/orders. Every status belongs to exactly one tab.
export const SHOP_ORDER_TABS = Object.freeze([
  { value: 'new', label: 'New', statuses: [ORDER_STATUS.PLACED] },
  {
    value: 'in_progress',
    label: 'In progress',
    statuses: [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PREPARING,
      ORDER_STATUS.OUT_FOR_DELIVERY,
      ORDER_STATUS.READY_FOR_PICKUP,
      ORDER_STATUS.DELIVERED,
      ORDER_STATUS.PICKED_UP,
    ],
  },
  { value: 'completed', label: 'Completed', statuses: [ORDER_STATUS.COMPLETED] },
  { value: 'cancelled', label: 'Cancelled', statuses: [ORDER_STATUS.CANCELLED] },
])

// The button that moves an order into each status.
export const NEXT_STEP_LABELS = Object.freeze({
  [ORDER_STATUS.PREPARING]: 'Start preparing',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Mark out for delivery',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Mark ready for pickup',
  [ORDER_STATUS.DELIVERED]: 'Mark delivered',
  [ORDER_STATUS.PICKED_UP]: 'Mark picked up',
  [ORDER_STATUS.COMPLETED]: 'Complete order',
})

// The status an order moves to next (null when it is finished, cancelled or still new).
export function nextOrderStatus(order) {
  if (order.status === ORDER_STATUS.CANCELLED) return null
  const flow = ORDER_FLOWS[order.fulfillment.method]
  return flow[flow.indexOf(order.status) + 1] ?? null
}

// What the payment line says, for the buyer, the shop and admins.
export function paymentSummary(order) {
  const { method, status } = order.payment
  if (status === 'refunded') return 'Refund issued'
  if (order.status === ORDER_STATUS.CANCELLED) return 'Nothing was charged'
  if (method === 'card') return 'Paid by card'
  return status === 'paid' ? 'Paid in cash' : PAYMENT_STATUS_LABELS.unpaid
}
