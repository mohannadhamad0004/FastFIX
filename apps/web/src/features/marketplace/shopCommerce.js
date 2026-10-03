// TODO: replace with real API call
//
// How each parts shop sells: whether it delivers (where, for what fee, how fast), whether customers
// can pick up (where, when) and which payment methods it accepts. A shop edits these in "Selling
// settings" on /profile; they are saved on its account (account.sellingSettings) and the
// marketplace returns them with the shop (shop.sellingSettings).
//
// A shop can only sell online when it has turned on delivery or pickup AND accepts at least one
// payment method (commerce.selling). Otherwise its parts show only "Ask about this part": no Add
// to cart, no Save. The cart and orders services check this too, and the api must.
//
// Shops that haven't saved settings yet use SEEDED_SETTINGS (the mock shops that already exist);
// every other shop starts with EMPTY_SETTINGS, so it isn't selling until it fills the form in.

export const PAYMENT_METHODS = Object.freeze({ CASH: 'cash', CARD: 'card' })
export const FULFILLMENT_METHODS = Object.freeze({ DELIVERY: 'delivery', PICKUP: 'pickup' })

/**
 * What a shop saves on /profile.
 * @typedef {Object} SellingSettings
 * @property {{ enabled: boolean, cities: string[], feeIls: number, freeAboveIls: number | null, estimatedTime: string }} delivery
 *   freeAboveIls: null = the fee is always charged. estimatedTime is free text, e.g. "1-2 business days".
 * @property {{ enabled: boolean, address: string, hours: string }} pickup
 * @property {{ cash: boolean, card: boolean }} payments   cash = cash on delivery / pay at pickup
 */

/** @type {SellingSettings} */
export const EMPTY_SETTINGS = Object.freeze({
  delivery: { enabled: false, cities: [], feeIls: 0, freeAboveIls: null, estimatedTime: '' },
  pickup: { enabled: false, address: '', hours: '' },
  payments: { cash: false, card: false },
})

const seeded = (delivery, pickup, payments) => ({
  delivery: delivery
    ? { enabled: true, ...delivery, estimatedTime: delivery.estimatedTime ?? '' }
    : EMPTY_SETTINGS.delivery,
  pickup: pickup ? { enabled: true, address: '', ...pickup } : EMPTY_SETTINGS.pickup,
  payments,
})

const CASH_AND_CARD = { cash: true, card: true }

const SEEDED_SETTINGS = {
  'alquds-auto-parts': seeded(
    { cities: ['Nablus', 'Tulkarm', 'Jenin'], feeIls: 25, freeAboveIls: 400, estimatedTime: 'Same day in Nablus, 1-2 days elsewhere' },
    { hours: 'Sat–Thu 08:30–18:00' },
    CASH_AND_CARD,
  ),
  'ramallah-motors-supply': seeded(
    { cities: ['Ramallah', 'Nablus', 'Bethlehem'], feeIls: 30, freeAboveIls: 600, estimatedTime: '1-2 business days' },
    { hours: 'Sat–Thu 09:00–19:00' },
    CASH_AND_CARD,
  ),
  'jenin-spare-parts': seeded(
    { cities: ['Jenin', 'Nablus'], feeIls: 20, freeAboveIls: null, estimatedTime: '2-3 business days' },
    { hours: 'Sat–Thu 08:00–17:00' },
    { cash: true, card: false },
  ),
  // Pickup only
  'tulkarm-car-accessories': seeded(null, { hours: 'Sat–Thu 09:00–17:30, Fri closed' }, CASH_AND_CARD),
  // Delivery only
  'hebron-genuine-parts': seeded(
    { cities: ['Hebron', 'Bethlehem'], feeIls: 35, freeAboveIls: 800, estimatedTime: '2-4 business days' },
    null,
    CASH_AND_CARD,
  ),
}

export const mapLink = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

/**
 * The settings to show in the form: what the shop saved, else the mock seed, else empty.
 * @param {{ id: string, sellingSettings?: SellingSettings | null }} shop
 * @returns {SellingSettings}
 */
export const getSellingSettings = (shop) => shop.sellingSettings ?? SEEDED_SETTINGS[shop.id] ?? EMPTY_SETTINGS

/**
 * What the buyer-facing code (cart, checkout, orders) needs, derived from the shop's settings.
 * @typedef {Object} ShopCommerce
 * @property {{ cities: string[], feeIls: number, freeAboveIls: number | null, estimatedTime: string } | null} delivery
 * @property {{ address: string, hours: string, mapUrl: string } | null} pickup
 * @property {('cash' | 'card')[]} payments
 * @property {boolean} selling   delivery or pickup is on, and at least one payment method is accepted
 */

/**
 * @param {import('./types.js').Shop} shop
 * @returns {ShopCommerce}
 */
export function getShopCommerce(shop) {
  const settings = getSellingSettings(shop)
  const delivery =
    settings.delivery.enabled && settings.delivery.cities.length > 0
      ? {
          cities: settings.delivery.cities,
          feeIls: settings.delivery.feeIls,
          freeAboveIls: settings.delivery.freeAboveIls,
          estimatedTime: settings.delivery.estimatedTime,
        }
      : null

  const pickupAddress = settings.pickup.address.trim() || [shop.address, shop.city].filter(Boolean).join(', ')
  const pickup =
    settings.pickup.enabled && pickupAddress
      ? {
          address: pickupAddress,
          hours: settings.pickup.hours,
          mapUrl: mapLink(`${shop.name}, ${pickupAddress}`),
        }
      : null

  const payments = [
    settings.payments.cash && PAYMENT_METHODS.CASH,
    settings.payments.card && PAYMENT_METHODS.CARD,
  ].filter(Boolean)

  return { delivery, pickup, payments, selling: Boolean((delivery || pickup) && payments.length > 0) }
}

// The delivery fee for one shop's items: 0 above the shop's free-delivery threshold.
export function deliveryFee(commerce, subtotalIls) {
  const { delivery } = commerce
  if (!delivery) return 0
  return delivery.freeAboveIls != null && subtotalIls >= delivery.freeAboveIls ? 0 : delivery.feeIls
}

export const paymentLabel = (method, fulfillment) =>
  method === PAYMENT_METHODS.CARD
    ? 'Card payment'
    : fulfillment === FULFILLMENT_METHODS.PICKUP
      ? 'Pay at pickup'
      : 'Cash on delivery'

// --- Validation (the form checks first for quick feedback; profileService and the api repeat it) ---

const isBlank = (value) => !String(value ?? '').trim()
const isAmount = (value) => !isBlank(value) && Number.isFinite(Number(value)) && Number(value) >= 0

export const SELLING_TIME_MAX_LENGTH = 80

/**
 * @param {{ delivery: Object, pickup: Object, payments: Object }} values  the form's values; the
 *   fee and the free-delivery amount may still be strings
 * @returns {Object<string, string>} messages by field id, in on-screen order
 */
export function sellingSettingsErrors(values) {
  const errors = {}
  const { delivery, pickup, payments } = values

  if (delivery.enabled) {
    if (delivery.cities.length === 0) errors.deliveryCities = 'Add at least one city you deliver to.'
    if (!isAmount(delivery.feeIls)) errors.deliveryFee = 'Enter the delivery fee in ₪ (0 for free delivery).'
    if (!isBlank(delivery.freeAboveIls) && !isAmount(delivery.freeAboveIls)) {
      errors.freeAbove = 'Enter an amount in ₪, or leave it empty.'
    }
    if (isBlank(delivery.estimatedTime)) errors.estimatedTime = 'Tell customers how long delivery takes, e.g. 1-2 business days.'
    else if (delivery.estimatedTime.trim().length > SELLING_TIME_MAX_LENGTH) {
      errors.estimatedTime = `Keep it under ${SELLING_TIME_MAX_LENGTH} characters.`
    }
  }
  if (pickup.enabled) {
    if (isBlank(pickup.address)) errors.pickupAddress = 'Enter the address customers pick up from.'
    if (isBlank(pickup.hours)) errors.pickupHours = 'Enter your pickup hours, e.g. Sat–Thu 09:00–17:00.'
  }
  if (!delivery.enabled && !pickup.enabled) errors.fulfillment = 'Turn on delivery or pickup, or customers can’t buy from you.'
  if (!payments.cash && !payments.card) errors.payments = 'Accept at least one payment method.'
  return errors
}

/** The form's values cleaned up for saving: numbers as numbers, lists trimmed. @returns {SellingSettings} */
export function cleanSellingSettings({ delivery, pickup, payments }) {
  return {
    delivery: {
      enabled: Boolean(delivery.enabled),
      cities: [...new Set(delivery.cities.map((city) => city.trim()).filter(Boolean))],
      feeIls: isAmount(delivery.feeIls) ? Number(delivery.feeIls) : 0,
      freeAboveIls: isBlank(delivery.freeAboveIls) ? null : Number(delivery.freeAboveIls),
      estimatedTime: String(delivery.estimatedTime ?? '').trim(),
    },
    pickup: { enabled: Boolean(pickup.enabled), address: String(pickup.address ?? '').trim(), hours: String(pickup.hours ?? '').trim() },
    payments: { cash: Boolean(payments.cash), card: Boolean(payments.card) },
  }
}
