// TODO: replace with real API call
// Orders and saved addresses that exist when the app starts, so /orders has something to show for the
// test customer (customer@fastfix.test, u-2). Times are relative to when the app loads.
//
//   FF-10001  o-1  Al-Quds Auto Parts      pickup, cash      completed - the customer can rate the shop
//   FF-10002  o-2  Ramallah Motors Supply  delivery, card    out for delivery
//   FF-10002  o-3  Jenin Spare Parts       delivery, cash    placed - can still be cancelled
// (o-2 and o-3 were checked out together, so they share a checkout number.)

import { mapLink } from './shopCommerce.js'

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
const daysAgo = (days) => hoursAgo(days * 24)
const buyer = { buyerId: 'u-2', buyerRole: 'customer', buyerName: 'Layla Customer' }

const homeAddress = { label: 'Home', address: 'Al Nour Street 14, Downtown', city: 'Nablus' }

export const seedOrders = [
  {
    id: 'o-1',
    checkoutId: 'co-1',
    checkoutNumber: 'FF-10001',
    ...buyer,
    shopId: 'alquds-auto-parts',
    shopName: 'Al-Quds Auto Parts',
    createdAt: daysAgo(9),
    status: 'completed',
    stockState: 'deducted',
    items: [
      { partId: 'p-001', name: 'Front brake disc, 288 mm vented', partNumber: '1K0615301AA', brand: 'Bosch', priceIls: 185, quantity: 2 },
    ],
    fulfillment: {
      method: 'pickup',
      address: 'Nablus',
      hours: 'Sat–Thu 08:30–18:00',
      mapUrl: mapLink('Al-Quds Auto Parts, Nablus'),
    },
    subtotalIls: 370,
    deliveryFeeIls: 0,
    totalIls: 370,
    payment: { method: 'cash', status: 'paid' },
    serviceRequestId: null,
    chatRequestId: null,
    cancellation: null,
    timeline: [
      { status: 'placed', at: daysAgo(9) },
      { status: 'confirmed', at: daysAgo(9) },
      { status: 'preparing', at: daysAgo(8.9) },
      { status: 'ready_for_pickup', at: daysAgo(8.5) },
      { status: 'picked_up', at: daysAgo(8) },
      { status: 'completed', at: daysAgo(8) },
    ],
  },
  {
    id: 'o-2',
    checkoutId: 'co-2',
    checkoutNumber: 'FF-10002',
    ...buyer,
    shopId: 'ramallah-motors-supply',
    shopName: 'Ramallah Motors Supply',
    createdAt: hoursAgo(6),
    status: 'out_for_delivery',
    stockState: 'deducted',
    items: [
      { partId: 'p-004', name: 'Front brake pad set', partNumber: '1K0698151A', brand: 'Brembo', priceIls: 160, quantity: 1 },
      { partId: 'p-007', name: 'Poly-V serpentine belt 6PK1070', partNumber: '04E260849B', brand: 'Gates', priceIls: 65, quantity: 2 },
    ],
    fulfillment: { method: 'delivery', address: homeAddress, feeIls: 30 },
    subtotalIls: 290,
    deliveryFeeIls: 30,
    totalIls: 320,
    payment: { method: 'card', status: 'paid' },
    serviceRequestId: null,
    chatRequestId: null,
    cancellation: null,
    timeline: [
      { status: 'placed', at: hoursAgo(6) },
      { status: 'confirmed', at: hoursAgo(5.5) },
      { status: 'preparing', at: hoursAgo(4) },
      { status: 'out_for_delivery', at: hoursAgo(1) },
    ],
  },
  {
    id: 'o-3',
    checkoutId: 'co-2',
    checkoutNumber: 'FF-10002',
    ...buyer,
    shopId: 'jenin-spare-parts',
    shopName: 'Jenin Spare Parts Center',
    createdAt: hoursAgo(6),
    status: 'placed',
    stockState: 'reserved',
    items: [{ partId: 'p-009', name: 'Iridium spark plug', partNumber: '04E905612C', brand: 'NGK', priceIls: 42, quantity: 4 }],
    fulfillment: { method: 'delivery', address: homeAddress, feeIls: 20 },
    subtotalIls: 168,
    deliveryFeeIls: 20,
    totalIls: 188,
    payment: { method: 'cash', status: 'unpaid' },
    serviceRequestId: null,
    chatRequestId: null,
    cancellation: null,
    timeline: [{ status: 'placed', at: hoursAgo(6) }],
  },
]

// Units held by seed orders that are still waiting for their shop (stockState 'reserved'), so each part's
// reserved count matches the orders.
export const seedReservedByPart = seedOrders
  .filter((order) => order.stockState === 'reserved')
  .flatMap((order) => order.items)
  .reduce((totals, item) => ({ ...totals, [item.partId]: (totals[item.partId] ?? 0) + item.quantity }), {})

export const seedAddresses = { 'u-2': [{ id: 'a-1', ...homeAddress }] }
