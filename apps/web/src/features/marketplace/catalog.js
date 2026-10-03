// The marketplace catalogue: main groups -> categories -> subcategories, and how parts are sorted
// into them. A part has one `category` (CATEGORIES in constants.js, what the shop picks); a
// catalogue category takes the parts of one or more of those, optionally narrowed by name
// (`match`), so "Oils & Fluids" splits into engine oil, transmission fluid, coolant and brake fluid.
// Subcategories narrow a category further by name. Parts that match no subcategory still show in
// their category. `icon` names an icon in components/CatalogIcon.jsx.
// TODO: move to the api once categories are managed there.

import { compareRatings } from '../requests/ratings.js'
import images from './catalogImages.json' with { type: 'json' }
import { fitsVehicle } from './filters.js'
import { formatPrice } from './format.js'

/**
 * @typedef {Object} CatalogSubcategory
 * @property {string} slug
 * @property {string} name
 * @property {RegExp} match   against the part name (lowercase)
 * @property {string} photoQuery  Pixabay search words for scripts/fetch-images.mjs
 * @property {string} [image]    photo URL (public/images/marketplace), set from catalogImages.json
 */

/**
 * @typedef {Object} CatalogCategory
 * @property {string} slug
 * @property {string} name
 * @property {string} icon
 * @property {string} photoQuery
 * @property {string} [image]
 * @property {string} [bannerQuery]  Pixabay search words for the wide offer-banner photo (default: photoQuery)
 * @property {string[]} from     part.category values it takes
 * @property {RegExp} [match]    only parts whose name matches (when several categories share `from`)
 * @property {CatalogSubcategory[]} subcategories
 */

/**
 * @typedef {Object} CatalogGroup
 * @property {string} slug
 * @property {string} name
 * @property {string} icon
 * @property {string} description
 * @property {string} photoQuery
 * @property {string} [image]
 * @property {CatalogCategory[]} categories
 */

const sub = (slug, name, match, photoQuery) => ({ slug, name, match, photoQuery })

/** @type {CatalogGroup[]} */
export const GROUPS = [
  {
    slug: 'car-parts', photoQuery: 'car engine bay',
    name: 'Car parts',
    icon: 'engine',
    description: 'Brakes, engine, filters, suspension, lighting, body and more.',
    categories: [
      {
        slug: 'brake-system', photoQuery: 'car brake disc',
        name: 'Brake system',
        icon: 'brake',
        from: ['Brakes'],
        subcategories: [sub('brake-discs', 'Brake discs', /disc/, 'car brake disc rotor'), sub('brake-pads', 'Brake pads', /pad/, 'brake pads auto parts')],
      },
      {
        slug: 'engine', photoQuery: 'car engine',
        name: 'Engine parts',
        icon: 'engine',
        from: ['Engine'],
        subcategories: [sub('spark-plugs', 'Spark plugs', /spark plug/, 'spark plugs'), sub('belts', 'Belts', /belt/, 'car engine belt')],
      },
      {
        slug: 'filters', photoQuery: 'car air filter',
        name: 'Filters',
        icon: 'filter',
        from: ['Filters'],
        subcategories: [
          sub('oil-filters', 'Oil filters', /oil filter/, 'car oil filter'),
          sub('cabin-filters', 'Cabin filters', /cabin/, 'cabin air filter'),
          sub('air-filters', 'Engine air filters', /engine air filter/, 'car engine air filter'),
        ],
      },
      {
        slug: 'suspension-steering', photoQuery: 'car suspension spring',
        name: 'Suspension & steering',
        icon: 'suspension',
        from: ['Suspension', 'Steering'],
        subcategories: [
          sub('shock-absorbers', 'Shock absorbers', /shock|strut/, 'car shock absorber'),
          sub('steering-parts', 'Steering parts', /tie rod|steering pump|power steering/, 'car steering rack'),
          sub('steering-wheels', 'Steering wheels', /^steering wheel(?!.*cover)/, 'car steering wheel'),
        ],
      },
      {
        slug: 'electrical', photoQuery: 'car battery',
        name: 'Electrical',
        icon: 'battery',
        from: ['Electrical'],
        subcategories: [sub('alternators', 'Alternators & starters', /alternator|starter/, 'car alternator'), sub('ignition-coils', 'Ignition coils', /ignition|coil/, 'ignition coil')],
      },
      {
        slug: 'lighting', photoQuery: 'car headlight',
        name: 'Lighting',
        icon: 'light',
        from: ['Lighting'],
        subcategories: [sub('headlights', 'Headlights', /headlight assembly|led headlight/, 'car headlight'), sub('bulbs', 'Bulbs', /bulb/, 'car headlight bulb')],
      },
      {
        slug: 'body', photoQuery: 'car bumper',
        name: 'Body parts',
        icon: 'body',
        from: ['Body'],
        subcategories: [sub('bumpers', 'Bumpers', /bumper/, 'car bumper'), sub('mirrors', 'Mirrors', /mirror/, 'car side mirror')],
      },
      {
        slug: 'cooling', photoQuery: 'car radiator',
        name: 'Cooling',
        icon: 'cooling',
        from: ['Cooling'],
        subcategories: [sub('radiators', 'Radiators', /radiator/, 'car radiator'), sub('water-pumps', 'Water pumps', /water pump/, 'car water pump')],
      },
      {
        slug: 'transmission', photoQuery: 'car clutch',
        name: 'Transmission & clutch',
        icon: 'gear',
        from: ['Transmission'],
        subcategories: [sub('clutch-kits', 'Clutch kits', /clutch/, 'car clutch kit'), sub('mounts', 'Mounts', /mount/, 'engine mount')],
      },
    ],
  },
  {
    slug: 'oils-fluids', photoQuery: 'motor oil bottle',
    name: 'Oils & fluids',
    icon: 'oil',
    description: 'Engine oil, transmission fluid, coolant and brake fluid.',
    categories: [
      { slug: 'engine-oil', photoQuery: 'motor oil bottle', name: 'Engine oil', icon: 'oil', from: ['Oils & Fluids'], match: /engine oil/, subcategories: [] },
      {
        slug: 'transmission-fluid', photoQuery: 'transmission fluid gear oil',
        name: 'Transmission fluid',
        icon: 'drop',
        from: ['Oils & Fluids'],
        match: /transmission fluid|atf|gear oil/,
        subcategories: [],
      },
      { slug: 'coolant', photoQuery: 'car coolant antifreeze bottle', bannerQuery: 'car radiator engine cooling', name: 'Coolant', icon: 'cooling', from: ['Oils & Fluids'], match: /coolant|antifreeze/, subcategories: [] },
      { slug: 'brake-fluid', photoQuery: 'brake fluid bottle', name: 'Brake fluid', icon: 'drop', from: ['Oils & Fluids'], match: /brake fluid/, subcategories: [] },
    ],
  },
  {
    slug: 'tires-wheels', photoQuery: 'car tire',
    name: 'Tires & wheels',
    icon: 'tire',
    description: 'Summer and winter tires, alloy wheels.',
    categories: [
      {
        slug: 'tires', photoQuery: 'car tire',
        name: 'Tires',
        icon: 'tire',
        from: ['Tires & Wheels'],
        match: /tire|tyre/,
        subcategories: [sub('summer-tires', 'Summer tires', /summer/, 'car tire'), sub('winter-tires', 'Winter tires', /winter/, 'winter tire snow')],
      },
      { slug: 'wheels', photoQuery: 'alloy wheel rim', name: 'Wheels', icon: 'wheel', from: ['Tires & Wheels'], match: /wheel|rim/, subcategories: [] },
    ],
  },
  {
    slug: 'accessories-equipment', photoQuery: 'car accessories',
    name: 'Accessories & equipment',
    icon: 'accessories',
    description: 'Roof bars, spoilers, mats, covers and car electronics.',
    categories: [
      {
        slug: 'exterior-accessories', photoQuery: 'car roof rack',
        name: 'Exterior accessories',
        icon: 'roof',
        from: ['Accessories'],
        match: /roof|rack|cross bar|spoiler|deflector|wiper/,
        subcategories: [
          sub('roof-bars', 'Roof bars', /roof|rack|cross bar/, 'car roof bars'),
          sub('spoilers', 'Spoilers', /spoiler/, 'car spoiler'),
          sub('wipers', 'Wiper blades', /wiper/, 'car wiper blade'),
        ],
      },
      {
        slug: 'car-electronics', photoQuery: 'dash cam car',
        name: 'Car electronics',
        icon: 'camera',
        from: ['Accessories'],
        match: /camera|dash cam|charger|holder/,
        subcategories: [],
      },
      {
        slug: 'interior-accessories', photoQuery: 'car interior seat',
        name: 'Interior accessories',
        icon: 'seat',
        from: ['Accessories'],
        subcategories: [sub('floor-mats', 'Floor mats', /mat/, 'car floor mats'), sub('covers', 'Covers', /cover/, 'car seat cover')],
      },
    ],
  },
  {
    slug: 'tools', photoQuery: 'mechanic tools wrench',
    name: 'Tools',
    icon: 'wrench',
    description: 'Hand tools, jacks and diagnostic scanners.',
    categories: [
      { slug: 'hand-tools', photoQuery: 'wrench set', name: 'Hand tools', icon: 'wrench', from: ['Tools'], match: /wrench|socket|screwdriver/, subcategories: [] },
      { slug: 'lifting', photoQuery: 'car jack', name: 'Jacks & stands', icon: 'jack', from: ['Tools'], match: /jack|stand/, subcategories: [] },
      { slug: 'diagnostics', photoQuery: 'car diagnostic', name: 'Diagnostics', icon: 'scanner', from: ['Tools'], match: /obd|scanner|tester/, subcategories: [] },
    ],
  },
]

// Fill `image` from the photos scripts/fetch-images.mjs downloaded (catalogImages.json: slug -> URL).
for (const group of GROUPS) {
  group.image = images[group.slug]
  for (const category of group.categories) {
    category.image = images[category.slug]
    for (const subcategory of category.subcategories) subcategory.image = images[subcategory.slug]
  }
}

export const findGroup = (slug) => GROUPS.find((group) => group.slug === slug) ?? null
export const findCategory = (group, slug) => group?.categories.find((category) => category.slug === slug) ?? null

const lower = (part) => part.name.toLowerCase()

// The first catalogue category that takes the part: a category with `match` takes only matching
// names; a category without one takes the rest of its `from` categories.
const partPlacement = new WeakMap()
/** @returns {{ group: CatalogGroup, category: CatalogCategory } | null} */
export function placePart(part) {
  if (partPlacement.has(part)) return partPlacement.get(part)
  let found = null
  for (const group of GROUPS) {
    for (const category of group.categories) {
      if (!category.from.includes(part.category)) continue
      if (category.match && !category.match.test(lower(part))) continue
      found = { group, category }
      break
    }
    if (found) break
  }
  // Nothing matched by name: the first category of the right kind.
  if (!found) {
    for (const group of GROUPS) {
      const category = group.categories.find((c) => c.from.includes(part.category))
      if (category) {
        found = { group, category }
        break
      }
    }
  }
  partPlacement.set(part, found)
  return found
}

export const inGroup = (parts, group) => parts.filter((part) => placePart(part)?.group === group)
export const inCategory = (parts, category) => parts.filter((part) => placePart(part)?.category === category)
export const inSubcategory = (parts, subcategory) => parts.filter((part) => subcategory.match.test(lower(part)))

export const categoryPath = (group, category) => `/marketplace/${group.slug}/${category.slug}`
export const partPath = (part) => `/marketplace/part/${part.id}`

/**
 * Photos to try for a part, best first: its own (public/images/parts/<id>.webp), then its category's.
 * The caller falls back to the category icon (partIcon) when none loads.
 * @returns {{ src: string, alt: string }[]}
 */
export function partPhotos(part) {
  const category = placePart(part)?.category
  return [
    images[part.id] && { src: images[part.id], alt: part.name },
    category?.image && { src: category.image, alt: category.name },
  ].filter(Boolean)
}

/** The catalogue icon for a part (its category's icon). */
export const partIcon = (part) => placePart(part)?.category.icon ?? 'engine'

// --- Offers, popularity, recency -------------------------------------------------------------

export const OFFER_TAG_NAME = 'On Offer'

/** Whether the part has the admin's "On Offer" tag (`tags` from useTags()). */
export function isOnOffer(part, tags) {
  const offerTag = tags?.find((tag) => tag.name === OFFER_TAG_NAME)
  return Boolean(offerTag && part.tagIds?.includes(offerTag.id))
}

/** 25 for a part at ₪150 that used to cost ₪200; 0 without an earlier price. */
export function discountPercent(part) {
  if (!part.compareAtPriceIls || part.compareAtPriceIls <= part.priceIls) return 0
  return Math.round((1 - part.priceIls / part.compareAtPriceIls) * 100)
}

/** Parts that fit `vehicle` ({ make, model?, year? }), or all parts when no vehicle is chosen. */
export const forVehicle = (parts, vehicle) => (vehicle?.make ? parts.filter((part) => fitsVehicle(part, vehicle)) : parts)

const byDateDesc = (key) => (a, b) => (b[key] ?? '').localeCompare(a[key] ?? '')

export const mostPopular = (parts) => [...parts].sort((a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0)).filter((p) => p.salesCount)
export const recentlyAdded = (parts) => [...parts].sort(byDateDesc('addedAt'))
// Price or stock changed after the part was listed.
export const recentlyUpdated = (parts) =>
  parts.filter((part) => part.updatedAt && part.updatedAt > part.addedAt).sort(byDateDesc('updatedAt'))
export const onOffer = (parts, tags) =>
  parts.filter((part) => isOnOffer(part, tags)).sort((a, b) => discountPercent(b) - discountPercent(a))

/**
 * One offer banner per category with parts tagged "On Offer", biggest discount first.
 * @returns {{ id: string, title: string, subtitle: string, badge: string, to: string, icon: string, image?: string }[]}
 */
export function offerBanners(parts, tags) {
  const byCategory = new Map()
  for (const part of onOffer(parts, tags)) {
    const placed = placePart(part)
    if (!placed) continue
    const entry = byCategory.get(placed.category) ?? { ...placed, parts: [] }
    entry.parts.push(part)
    byCategory.set(placed.category, entry)
  }
  return [...byCategory.values()]
    .map(({ group, category, parts: offerParts }) => {
      const best = Math.max(...offerParts.map(discountPercent))
      const cheapest = Math.min(...offerParts.map((part) => part.priceIls))
      const shopCount = new Set(offerParts.map((part) => part.shopId)).size
      return {
        id: category.slug,
        best,
        title: `${category.name} on offer`,
        subtitle: `${offerParts.length} ${offerParts.length === 1 ? 'deal' : 'deals'} from ${shopCount} ${shopCount === 1 ? 'shop' : 'shops'}, from ${formatPrice(cheapest)}`,
        badge: best > 0 ? `Up to ${best}% off` : 'On offer',
        to: `${categoryPath(group, category)}?offers=1`,
        icon: category.icon,
        image: images[`banner-${category.slug}`],
      }
    })
    .sort((a, b) => b.best - a.best)
    .map(({ best: _best, ...banner }) => banner)
}

// --- Sorting results -------------------------------------------------------------------------

export const RESULT_SORTS = Object.freeze([
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Rating' },
])

/**
 * @param {import('./types.js').Part[]} parts  in relevance order
 * @param {string} sort
 * @param {Object<string, { average: number, count: number }>} ratings  shop ratings by shop id
 */
export function sortResults(parts, sort, ratings = {}) {
  const list = [...parts]
  if (sort === 'price-asc') list.sort((a, b) => a.priceIls - b.priceIls)
  if (sort === 'price-desc') list.sort((a, b) => b.priceIls - a.priceIls)
  if (sort === 'rating') list.sort((a, b) => compareRatings(ratings[a.shopId], ratings[b.shopId])) // shops under 3 reviews: after rated ones
  return list
}
