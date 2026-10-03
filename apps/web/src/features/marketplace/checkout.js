import { deliveryFee, FULFILLMENT_METHODS } from './shopCommerce.js'

// Helpers for the checkout page. The page keeps one "choice" per shop in the cart:
//   { method: 'delivery' | 'pickup', addressId: string | null, payment: 'cash' | 'card' }
// and turns them into the draft that ordersService.placeOrder takes.

// What a shop offers decides the starting choice: delivery when it delivers, else pickup; the
// first payment method it accepts.
export function defaultChoice({ commerce }) {
  return {
    method: commerce.delivery ? FULFILLMENT_METHODS.DELIVERY : FULFILLMENT_METHODS.PICKUP,
    addressId: null,
    payment: commerce.payments[0],
  }
}

export const choiceFor = (group, choices) => ({ ...defaultChoice(group), ...choices[group.shop.id] })

export const findAddress = (addresses, addressId) => addresses.find((address) => address.id === addressId) ?? null

// Why a delivery address can't be used for this shop, or null.
export function addressProblem(commerce, address) {
  if (!commerce.delivery) return "This shop doesn't deliver."
  if (!address.address?.trim()) return 'Enter the street and building.'
  if (!commerce.delivery.cities.includes(address.city)) {
    return `Not in this shop's delivery area (${commerce.delivery.cities.join(', ')}).`
  }
  return null
}

// What stops the buyer from leaving the delivery step for this shop, or null.
export function deliveryProblem(group, choice, addresses) {
  const { commerce, shop } = group
  if (choice.method === FULFILLMENT_METHODS.PICKUP) {
    return commerce.pickup ? null : `${shop.name} doesn't offer pickup.`
  }
  if (!commerce.delivery) return `${shop.name} doesn't deliver.`
  const address = findAddress(addresses, choice.addressId)
  if (!address) return 'Choose a delivery address, or add a new one.'
  return addressProblem(commerce, address)
}

export const feeFor = (group, choice) =>
  choice.method === FULFILLMENT_METHODS.DELIVERY ? deliveryFee(group.commerce, group.subtotalIls) : 0

// The payload for ordersService.placeOrder.
export function toDraft(view, choices, addresses, serviceRequestId) {
  return {
    serviceRequestId: serviceRequestId || null,
    groups: Object.fromEntries(
      view.groups.map((group) => {
        const choice = choiceFor(group, choices)
        const address = findAddress(addresses, choice.addressId)
        return [
          group.shop.id,
          {
            method: choice.method,
            payment: choice.payment,
            ...(choice.method === FULFILLMENT_METHODS.DELIVERY && address && { address }),
          },
        ]
      }),
    ),
  }
}
