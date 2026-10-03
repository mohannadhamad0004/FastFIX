// TODO: replace mock implementation with real API calls
//
// Every marketplace read and write goes through this service. Each function returns a Promise,
// so pages already use the same call style they will use with the real API.
//
// For now the data lives in React state inside MarketplaceProvider. The provider passes a small
// store ({ read, write }) to createMarketplaceService, and pages get the service with
// useMarketplaceService(). Data is kept in memory only, so a full page reload resets it.
//
// Ownership: addPart, updatePart and deletePart reject with "You can only manage your own parts"
// unless the logged-in user is the parts shop that owns the part. The api must check this too.
//
// Moderation (set by admins through features/admin/adminService.js):
//   part.hidden = { reason, hiddenAt }  - hidden parts disappear from every public read; the shop
//                                         still sees them, with the reason, via getShopInventory.
//   shop.suspended = true               - the shop's account is suspended: the shop and all its
//                                         parts disappear from public reads.
//   part.tagIds                         - admin-assigned tags; shops can't change them.
//
// A shop's public details (name, city, address, description, logo, photos) come from its parts
// shop account, which the shop edits on /profile. The name is the approved one: a new name only
// shows here after an admin approves it.

import { ACCOUNT_STATUS } from '../../auth/constants.js'
import { ROLES } from '../../authorization/roles.js'
import { OWN_PARTS_ONLY, ownsShop } from './ownership.js'

/** @typedef {import('./types.js').Shop} Shop */
/** @typedef {import('./types.js').Part} Part */

/**
 * @typedef {Object} MarketplaceData
 * @property {Shop[]} shops
 * @property {Part[]} parts
 */

/**
 * @typedef {Object} MockStore
 * @property {() => MarketplaceData} read
 * @property {(next: MarketplaceData) => void} write
 */

// Copies results so callers can't change the stored data by mutating what they got back,
// the same as data coming from a real API.
const copy = (value) => structuredClone(value)

// "p-043" -> next id "p-044"
function nextPartId(parts) {
  const max = parts.reduce((highest, part) => {
    const number = Number(part.id.replace(/^p-/, ''))
    return Number.isFinite(number) ? Math.max(highest, number) : highest
  }, 0)
  return `p-${String(max + 1).padStart(3, '0')}`
}

const today = () => new Date().toISOString().slice(0, 10)

// Shops can't change these through updatePart; hidden and tagIds are set by admins only.
// `reserved` is changed by orders only (adjustStock).
const LOCKED_FIELDS = ['id', 'shopId', 'addedAt', 'hidden', 'tagIds', 'reserved']

// Public reads leave out the moderation details, and show the stock buyers can still order:
// what is on the shelf minus what is reserved for orders the shop hasn't confirmed yet.
function toPublicPart(part) {
  const result = copy(part)
  delete result.hidden
  delete result.reserved
  result.stock = part.stock - (part.reserved ?? 0)
  return result
}

const isPublicShopAccount = (account) =>
  account?.role === ROLES.PARTS_SHOP && account.status === ACCOUNT_STATUS.APPROVED && !account.suspended

// The shop entry with the public details from its account, if it has one.
function withProfile(shop, accounts) {
  const account = accounts.find((a) => a.id === shop.id)
  if (!account) return shop
  return {
    ...shop,
    name: account.name,
    city: account.city ?? shop.city,
    address: account.address ?? '',
    description: account.description ?? shop.description,
    logo: account.profilePhoto ?? null,
    photos: account.shopPhotos ?? [],
    sellingSettings: account.sellingSettings ?? null,
  }
}

/**
 * @param {MockStore} store
 * @param {{ getCurrentUser: () => Promise<import('../../auth/types.js').Account | null> }} auth
 *   the auth service - writes check who is logged in, like the api reads the session
 * @param {() => import('../../auth/types.js').Account[]} [readAccounts]  the accounts, for the
 *   shops' public details (the api joins the shops and users tables)
 */
export function createMarketplaceService(store, auth, readAccounts = () => []) {
  // --- Public reads: no suspended shops, no hidden parts ---------------------------------------

  function publicData() {
    const { shops, parts } = store.read()
    const accounts = readAccounts()
    const visibleShops = shops.filter((shop) => !shop.suspended).map((shop) => withProfile(shop, accounts))
    const visibleIds = new Set(visibleShops.map((shop) => shop.id))
    return { shops: visibleShops, parts: parts.filter((part) => !part.hidden && visibleIds.has(part.shopId)) }
  }

  /** @returns {Promise<Shop[]>} */
  async function getShops() {
    return copy(publicData().shops)
  }

  /** @returns {Promise<Shop | null>} null when there is no such shop, or it is suspended */
  async function getShopById(id) {
    const shop = publicData().shops.find((s) => s.id === id) ?? newShopWithoutParts(id)
    return shop ? copy(shop) : null
  }

  // A parts shop approved after signup has no marketplace entry until its first part, but its
  // shop page (linked from /profile) still shows its details.
  function newShopWithoutParts(id) {
    const accounts = readAccounts()
    const account = accounts.find((a) => a.id === id)
    const listed = store.read().shops.some((s) => s.id === id)
    if (listed || !isPublicShopAccount(account)) return null
    return withProfile({ id, name: account.name, city: account.city, description: account.description }, accounts)
  }

  /** @returns {Promise<Part[]>} */
  async function getParts() {
    return publicData().parts.map(toPublicPart)
  }

  /** @returns {Promise<Part | null>} null when the part doesn't exist or isn't public */
  async function getPartById(partId) {
    const part = publicData().parts.find((p) => p.id === partId)
    return part ? toPublicPart(part) : null
  }

  /** @returns {Promise<Part[]>} */
  async function getPartsByShop(shopId) {
    return publicData()
      .parts.filter((part) => part.shopId === shopId)
      .map(toPublicPart)
  }

  /**
   * The logged-in shop's own parts, including ones an admin hid (with part.hidden.reason), plus
   * its shop entry (null until its first part). For the /parts-shop dashboard.
   * @returns {Promise<{ shop: Shop | null, parts: Part[] }>}
   */
  async function getShopInventory(shopId) {
    await requireOwner(shopId)
    const { shops, parts } = store.read()
    const shop = shops.find((s) => s.id === shopId)
    return copy({
      shop: shop ? withProfile(shop, readAccounts()) : null,
      parts: parts.filter((part) => part.shopId === shopId),
    })
  }

  // --- Writes: only the shop that owns the part (see ownership.js) ---------------------------

  // Rejects unless the logged-in user is an approved parts shop whose id is `shopId`.
  async function requireOwner(shopId) {
    const user = await auth.getCurrentUser()
    if (!ownsShop(user, shopId)) throw new Error(OWN_PARTS_ONLY)
    return user
  }

  function findPart(partId) {
    const part = store.read().parts.find((p) => p.id === partId)
    if (!part) throw new Error(`Unknown part: ${partId}`)
    return part
  }

  /**
   * Adds a part to the logged-in shop. A shop approved after signup has no marketplace entry yet,
   * so its first part creates one (its public details then come from the account).
   * @param {string} shopId  must be the logged-in parts shop's own id
   * @param {Omit<Part, 'id' | 'shopId' | 'addedAt'>} part
   * @returns {Promise<Part>} the stored part, with its new id
   */
  async function addPart(shopId, part) {
    const user = await requireOwner(shopId)
    const data = store.read()
    const shops = data.shops.some((shop) => shop.id === shopId)
      ? data.shops
      : [...data.shops, { id: user.id, name: user.name, city: user.city ?? '', description: user.description ?? '' }]

    const fields = Object.fromEntries(Object.entries(copy(part)).filter(([key]) => !LOCKED_FIELDS.includes(key)))
    const created = { ...fields, id: nextPartId(data.parts), shopId, addedAt: today(), updatedAt: today(), tagIds: [], hidden: null, reserved: 0 }
    store.write({ ...data, shops, parts: [...data.parts, created] })
    return copy(created)
  }

  /**
   * @param {string} partId
   * @param {Partial<Part>} changes  id, shopId, addedAt, hidden and tagIds can't be changed
   * @returns {Promise<Part>}
   */
  async function updatePart(partId, changes) {
    await requireOwner(findPart(partId).shopId)
    const data = store.read()
    const existing = findPart(partId)

    const allowed = Object.entries(copy(changes)).filter(([key]) => !LOCKED_FIELDS.includes(key))
    const reserved = existing.reserved ?? 0
    if ('stock' in changes && Number(changes.stock) < reserved) {
      throw new Error(`Stock can't be lower than ${reserved}: that many are reserved for orders waiting for you to confirm.`)
    }
    const updated = { ...existing, ...Object.fromEntries(allowed) }
    // 'Recently updated' on /marketplace: the price or the stock changed.
    if (updated.priceIls !== existing.priceIls || updated.stock !== existing.stock) updated.updatedAt = today()
    store.write({ ...data, parts: data.parts.map((part) => (part.id === partId ? updated : part)) })
    return copy(updated)
  }

  /** @returns {Promise<void>} */
  async function deletePart(partId) {
    await requireOwner(findPart(partId).shopId)
    const data = store.read()
    store.write({ ...data, parts: data.parts.filter((part) => part.id !== partId) })
  }

  // --- Stock changes from orders ---------------------------------------------------------------

  /**
   * Stock moves caused by orders. A part has `stock` (on the shelf) and `reserved` (promised to
   * placed orders the shop hasn't confirmed). Buyers see stock - reserved.
   *   placing an order    -> reservedDelta +qty          (reserve)
   *   shop confirms       -> stockDelta -qty, reservedDelta -qty   (deduct)
   *   cancel / reject before confirming -> reservedDelta -qty      (release)
   *   cancel after confirming           -> stockDelta +qty         (return)
   * Called by the orders service, not by pages and not owner-checked: the api does this inside the
   * same transaction as the order change. Rejects, changing nothing, if a part would end with
   * negative stock, more reserved than on the shelf, or negative reserved. With `lenient`, parts
   * that no longer exist are skipped and `reserved` never goes below zero (releasing or returning
   * stock of an order whose part the shop has deleted).
   * @param {{ partId: string, stockDelta?: number, reservedDelta?: number }[]} changes
   * @param {{ lenient?: boolean }} [options]
   * @returns {Promise<void>}
   */
  async function adjustStock(changes, { lenient = false } = {}) {
    const data = store.read()
    const byId = new Map(data.parts.map((part) => [part.id, { stock: part.stock, reserved: part.reserved ?? 0 }]))
    for (const { partId, stockDelta = 0, reservedDelta = 0 } of changes) {
      const entry = byId.get(partId)
      if (!entry) {
        if (lenient) continue
        throw new Error(`Unknown part: ${partId}`)
      }
      entry.stock += stockDelta
      entry.reserved += reservedDelta
      if (lenient) entry.reserved = Math.max(entry.reserved, 0)
      if (entry.stock < 0 || entry.reserved < 0 || entry.stock < entry.reserved) throw new Error('Not enough stock')
    }
    store.write({
      ...data,
      parts: data.parts.map((part) => {
        const next = byId.get(part.id)
        // A change on the shelf (not just a reservation) counts as a stock update.
        return next.stock !== part.stock ? { ...part, ...next, updatedAt: today() } : { ...part, ...next }
      }),
    })
  }

  return {
    getShops,
    getShopById,
    getParts,
    getPartById,
    getPartsByShop,
    getShopInventory,
    addPart,
    updatePart,
    deletePart,
    adjustStock,
  }
}
