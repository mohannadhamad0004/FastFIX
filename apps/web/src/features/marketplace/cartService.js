// TODO: replace with real API calls
//
// The shopping cart, saved parts and the vehicle used for "does it fit?" warnings. Every function
// returns a Promise, like the real API will. Only customers and mechanics can buy (permission
// 'marketplace:buy'); the api must check the same.
//
// The cart holds part ids, quantities and the price the buyer last saw. Names, prices and stock
// are always read from the marketplace, so the cart view can tell the buyer what changed since
// they added an item (price changed, less stock, no longer for sale) before they can order.
//
// Mock: carts live in CartProvider's React state, one per user, and are kept in sessionStorage so
// they survive a refresh in the same tab. The api will keep them in the database.

import { ACCOUNT_STATUS } from '../../auth/constants.js'
import { PERMISSIONS } from '../../authorization/permissions.js'
import { fitsVehicle, getVehicleOptions } from './filters.js'
import { formatPrice } from './format.js'
import { getShopCommerce } from './shopCommerce.js'

export const BUY_PERMISSION = 'marketplace:buy'

export class CartError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CartError'
  }
}

/**
 * @typedef {Object} CartItem   what is stored
 * @property {string} partId
 * @property {number} quantity
 * @property {number} seenPriceIls   the price when the buyer added it, to detect price changes
 * @property {string} name           shown if the part is later removed from the marketplace
 */

/**
 * @typedef {Object} LineChange   what changed since the buyer added an item
 * @property {'price' | 'stock' | 'out' | 'unavailable'} type
 * @property {number} [from]       price: the price the buyer saw
 * @property {number} [to]         price: the price now
 * @property {number} [available]  stock: how many are left
 */

/**
 * @typedef {Object} CartLine
 * @property {string} partId
 * @property {import('./types.js').Part} part
 * @property {number} quantity
 * @property {number} lineTotalIls
 * @property {LineChange[]} changes
 * @property {boolean} fits   false when a vehicle is selected and the part doesn't fit it
 */

/**
 * @typedef {Object} CartGroup   the items from one shop; each shop is a separate order
 * @property {import('./types.js').Shop} shop
 * @property {import('./shopCommerce.js').ShopCommerce} commerce
 * @property {CartLine[]} lines
 * @property {number} subtotalIls
 */

/**
 * @typedef {Object} CartView
 * @property {CartGroup[]} groups
 * @property {{ partId: string, name: string, changes: LineChange[] }[]} changes  every item that
 *   changed (or disappeared), for the "something changed" notice
 * @property {number} itemCount
 * @property {number} subtotalIls   items only: delivery fees depend on checkout choices
 * @property {{ make: string, model: string, year: number | null } | null} vehicle
 * @property {ReturnType<typeof getVehicleOptions>} vehicleOptions
 */

// One sentence for the "what changed" notices.
export function describeChange(name, change) {
  switch (change.type) {
    case 'price':
      return `${name}: price changed from ${formatPrice(change.from)} to ${formatPrice(change.to)}.`
    case 'stock':
      return `${name}: only ${change.available} left in stock, so the quantity will be lowered.`
    case 'out':
      return `${name}: out of stock, so it will be removed.`
    default:
      return `${name}: no longer for sale, so it will be removed.`
  }
}

const EMPTY_CART = Object.freeze({ items: [], saved: [] })

/**
 * @param {{ read: () => { carts: Object<string, { items: CartItem[], saved: string[] }>, vehicle: Object | null },
 *           write: (next: Object) => void }} store
 * @param {{ getCurrentUser: () => Promise<import('../../auth/types.js').Account | null> }} auth
 * @param {Object} marketplace  the marketplace service
 */
export function createCartService(store, auth, marketplace) {
  async function requireBuyer() {
    const user = await auth.getCurrentUser()
    if (!user) throw new CartError('Log in to buy parts.')
    if (user.status !== ACCOUNT_STATUS.APPROVED || !PERMISSIONS[user.role]?.includes(BUY_PERMISSION)) {
      throw new CartError('Only customers and mechanics can buy parts.')
    }
    return user
  }

  const mine = (user) => store.read().carts[user.id] ?? EMPTY_CART

  function save(user, changes) {
    const current = store.read()
    store.write({ ...current, carts: { ...current.carts, [user.id]: { ...mine(user), ...changes } } })
  }

  // Everything that differs between what the buyer saw and what the shop has now.
  function changesFor(item, part) {
    if (!part) return [{ type: 'unavailable' }]
    if (part.stock === 0) return [{ type: 'out' }]
    const changes = []
    if (item.quantity > part.stock) changes.push({ type: 'stock', available: part.stock })
    if (item.seenPriceIls !== part.priceIls) changes.push({ type: 'price', from: item.seenPriceIls, to: part.priceIls })
    return changes
  }

  /**
   * The cart with live data, grouped by shop, with a warning on every item that changed or doesn't
   * fit the selected vehicle.
   * @returns {Promise<CartView>}
   */
  async function getCartView() {
    const user = await requireBuyer()
    const [parts, shops] = await Promise.all([marketplace.getParts(), marketplace.getShops()])
    const partsById = new Map(parts.map((part) => [part.id, part]))
    const shopsById = new Map(shops.map((shop) => [shop.id, shop]))
    const { vehicle } = store.read()

    const groups = new Map()
    const changes = []
    for (const item of mine(user).items) {
      const part = partsById.get(item.partId)
      const shop = part && shopsById.get(part.shopId)
      // A shop that stopped selling online (Selling settings) can't be ordered from any more.
      const sells = shop && getShopCommerce(shop).selling
      const lineChanges = changesFor(item, sells ? part : null)
      if (lineChanges.length > 0) changes.push({ partId: item.partId, name: part?.name ?? item.name, changes: lineChanges })
      if (!part || !sells) continue // listed in `changes`; accepting them removes the item

      const group = groups.get(shop.id) ?? { shop, commerce: getShopCommerce(shop), lines: [], subtotalIls: 0 }
      const lineTotalIls = part.priceIls * item.quantity
      group.lines.push({
        partId: part.id,
        part,
        quantity: item.quantity,
        lineTotalIls,
        changes: lineChanges,
        fits: !vehicle?.make || fitsVehicle(part, vehicle),
      })
      group.subtotalIls += lineTotalIls
      groups.set(shop.id, group)
    }

    const list = [...groups.values()]
    return structuredClone({
      groups: list,
      changes,
      itemCount: mine(user).items.reduce((sum, item) => sum + item.quantity, 0),
      subtotalIls: list.reduce((sum, group) => sum + group.subtotalIls, 0),
      vehicle: vehicle?.make ? vehicle : null,
      vehicleOptions: getVehicleOptions(parts),
    })
  }

  /**
   * Adds `quantity` of a part, up to its stock.
   * @returns {Promise<{ quantity: number, capped: boolean }>} the quantity now in the cart, and
   *   whether it was lowered to the stock
   */
  async function addItem(partId, quantity = 1) {
    const user = await requireBuyer()
    const part = await marketplace.getPartById(partId)
    if (!part) throw new CartError('This part is no longer for sale.')
    const shop = await marketplace.getShopById(part.shopId)
    if (!shop || !getShopCommerce(shop).selling) {
      throw new CartError("This shop isn't taking online orders. Use “Ask about this part” instead.")
    }
    if (part.stock < 1) throw new CartError('This part is out of stock.')
    const amount = Math.floor(Number(quantity))
    if (!(amount >= 1)) throw new CartError('Choose a quantity of 1 or more.')

    const { items } = mine(user)
    const existing = items.find((item) => item.partId === partId)
    const wanted = (existing?.quantity ?? 0) + amount
    const inCart = Math.min(wanted, part.stock)
    save(user, {
      items: existing
        ? items.map((item) => (item.partId === partId ? { ...item, quantity: inCart } : item))
        : [...items, { partId, quantity: inCart, seenPriceIls: part.priceIls, name: part.name }],
    })
    return { quantity: inCart, capped: wanted > part.stock }
  }

  /** Sets the quantity of an item in the cart. Can't exceed the stock. */
  async function setQuantity(partId, quantity) {
    const user = await requireBuyer()
    const part = await marketplace.getPartById(partId)
    if (!part) throw new CartError('This part is no longer for sale.')
    const amount = Math.floor(Number(quantity))
    if (!(amount >= 1)) throw new CartError('Choose a quantity of 1 or more.')
    if (amount > part.stock) throw new CartError(`Only ${part.stock} in stock.`)
    save(user, { items: mine(user).items.map((item) => (item.partId === partId ? { ...item, quantity: amount } : item)) })
  }

  async function removeItem(partId) {
    const user = await requireBuyer()
    save(user, { items: mine(user).items.filter((item) => item.partId !== partId) })
  }

  /** Empties the cart (after an order is placed). */
  async function clear() {
    const user = await requireBuyer()
    save(user, { items: [] })
  }

  /**
   * The buyer accepted what changed: new prices are now the seen prices, quantities are lowered to
   * the stock, and items that are out of stock or no longer for sale are removed.
   */
  async function acceptChanges() {
    const user = await requireBuyer()
    const parts = await marketplace.getParts()
    const partsById = new Map(parts.map((part) => [part.id, part]))
    const items = mine(user)
      .items.map((item) => {
        const part = partsById.get(item.partId)
        if (!part || part.stock === 0) return null
        return { ...item, quantity: Math.min(item.quantity, part.stock), seenPriceIls: part.priceIls }
      })
      .filter(Boolean)
    save(user, { items })
  }

  // --- Saved parts -------------------------------------------------------------------------------

  /** @returns {Promise<{ part: import('./types.js').Part, shop: import('./types.js').Shop }[]>} saved parts still for sale */
  async function getSavedParts() {
    const user = await requireBuyer()
    const [parts, shops] = await Promise.all([marketplace.getParts(), marketplace.getShops()])
    const shopsById = new Map(shops.map((shop) => [shop.id, shop]))
    const saved = mine(user).saved
    return structuredClone(
      saved
        .map((id) => parts.find((part) => part.id === id))
        .filter((part) => part && shopsById.has(part.shopId))
        .map((part) => ({ part, shop: shopsById.get(part.shopId) })),
    )
  }

  /** @returns {Promise<boolean>} whether the part is saved now */
  async function toggleSaved(partId) {
    const user = await requireBuyer()
    const { saved } = mine(user)
    const isSaved = saved.includes(partId)
    save(user, { saved: isSaved ? saved.filter((id) => id !== partId) : [...saved, partId] })
    return !isSaved
  }

  /** Moves a saved part into the cart. */
  async function moveToCart(partId) {
    const user = await requireBuyer()
    const result = await addItem(partId, 1)
    save(user, { saved: mine(user).saved.filter((id) => id !== partId) })
    return result
  }

  // --- Vehicle for fit warnings ------------------------------------------------------------------

  /** @param {{ make: string, model: string, year: number | null } | null} vehicle */
  async function setVehicle(vehicle) {
    const current = store.read()
    store.write({ ...current, vehicle: vehicle?.make ? { make: vehicle.make, model: vehicle.model ?? '', year: vehicle.year ?? null } : null })
  }

  return {
    getCartView,
    addItem,
    setQuantity,
    removeItem,
    clear,
    acceptChanges,
    getSavedParts,
    toggleSaved,
    moveToCart,
    setVehicle,
  }
}
