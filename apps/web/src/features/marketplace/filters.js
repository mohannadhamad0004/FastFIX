import { CONDITIONS, PART_TYPES, SORT_OPTIONS } from './constants.js'
import { formatPrice } from './format.js'

export const EMPTY_FILTERS = Object.freeze({
  q: '',
  make: '',
  model: '',
  year: null,
  category: '',
  brands: [],
  type: '',
  condition: '',
  minPrice: null,
  maxPrice: null,
  inStock: false,
  shops: [],
  city: '',
  sort: 'relevance',
})

// Filters and sorting for the marketplace. The text search itself runs on the server
// (api.js, usePartSearch.js).

export function fitsVehicle(part, { make, model, year }) {
  if (!make || part.universalFit) return true
  return part.fitments.some(
    (f) =>
      f.make === make &&
      (!model || f.model === model) &&
      (year == null || (f.yearFrom <= year && year <= f.yearTo)),
  )
}

function matchesFilters(part, shop, filters) {
  return (
    fitsVehicle(part, filters) &&
    (!filters.category || part.category === filters.category) &&
    (filters.brands.length === 0 || filters.brands.includes(part.brand)) &&
    (!filters.type || part.type === filters.type) &&
    (!filters.condition || part.condition === filters.condition) &&
    (filters.minPrice == null || part.priceIls >= filters.minPrice) &&
    (filters.maxPrice == null || part.priceIls <= filters.maxPrice) &&
    (!filters.inStock || part.stock > 0) &&
    (filters.shops.length === 0 || filters.shops.includes(part.shopId)) &&
    (!filters.city || shop?.city === filters.city)
  )
}

// "relevance" keeps the order from the search.
const sorters = {
  'price-asc': (a, b) => a.priceIls - b.priceIls,
  'price-desc': (a, b) => b.priceIls - a.priceIls,
  newest: (a, b) => b.addedAt.localeCompare(a.addedAt),
}

// Takes search results (best match first) and returns the ones passing the filters, each with its
// shop. Exact part number matches always come first, then the chosen sort order.
export function applyFilters(searchResults, shopsById, filters) {
  const results = searchResults
    .map((result) => ({ ...result, shop: result.shop ?? shopsById[result.part.shopId] }))
    .filter(({ part, shop }) => matchesFilters(part, shop, filters))

  const sortBy = sorters[filters.sort]
  // sort() is stable, so ties keep the search order
  if (sortBy) results.sort((a, b) => Number(b.exact) - Number(a.exact) || sortBy(a.part, b.part))
  return results
}

// Makes and models for the vehicle filter, taken from the parts' fitments so a newly added
// vehicle shows up too. Years span every fitment of that model.
export function getVehicleOptions(parts) {
  const byMake = new Map()
  for (const { make, model, yearFrom, yearTo } of parts.flatMap((part) => part.fitments)) {
    const models = byMake.get(make) ?? new Map()
    const existing = models.get(model)
    models.set(model, {
      name: model,
      yearFrom: Math.min(yearFrom, existing?.yearFrom ?? yearFrom),
      yearTo: Math.max(yearTo, existing?.yearTo ?? yearTo),
    })
    byMake.set(make, models)
  }
  const byName = (a, b) => a.localeCompare(b)
  return [...byMake]
    .sort(([a], [b]) => byName(a, b))
    .map(([make, models]) => ({ make, models: [...models.values()].sort((a, b) => byName(a.name, b.name)) }))
}

// ---- URL query string <-> filters ----

function readNumber(params, key) {
  const raw = params.get(key)
  if (raw == null || raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export function filtersFromSearchParams(params) {
  const sort = params.get('sort')
  return {
    q: params.get('q') ?? '',
    make: params.get('make') ?? '',
    model: params.get('model') ?? '',
    year: readNumber(params, 'year'),
    category: params.get('category') ?? '',
    brands: params.getAll('brand'),
    type: params.get('type') ?? '',
    condition: params.get('condition') ?? '',
    minPrice: readNumber(params, 'minPrice'),
    maxPrice: readNumber(params, 'maxPrice'),
    inStock: params.get('inStock') === '1',
    shops: params.getAll('shop'),
    city: params.get('city') ?? '',
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : 'relevance',
  }
}

export function filtersToSearchParams(filters) {
  const params = new URLSearchParams()
  const setIf = (key, value) => {
    if (value !== '' && value != null && value !== false) params.set(key, String(value))
  }
  setIf('q', filters.q)
  setIf('make', filters.make)
  setIf('model', filters.model)
  setIf('year', filters.year)
  setIf('category', filters.category)
  filters.brands.forEach((brand) => params.append('brand', brand))
  setIf('type', filters.type)
  setIf('condition', filters.condition)
  setIf('minPrice', filters.minPrice)
  setIf('maxPrice', filters.maxPrice)
  if (filters.inStock) params.set('inStock', '1')
  filters.shops.forEach((shopId) => params.append('shop', shopId))
  setIf('city', filters.city)
  if (filters.sort !== 'relevance') params.set('sort', filters.sort)
  return params
}

// ---- Active filter chips ----

const labelFor = (options, value) => options.find((option) => option.value === value)?.label ?? value

// Each chip carries the filter changes that remove it.
export function getActiveFilterChips(filters, shopsById) {
  const chips = []

  if (filters.q) chips.push({ key: 'q', label: `Search: "${filters.q}"`, changes: { q: '' } })
  if (filters.make) {
    const vehicle = [filters.make, filters.model, filters.year].filter(Boolean).join(' ')
    chips.push({ key: 'vehicle', label: vehicle, changes: { make: '', model: '', year: null } })
  }
  if (filters.category) {
    chips.push({ key: 'category', label: filters.category, changes: { category: '' } })
  }
  for (const brand of filters.brands) {
    chips.push({
      key: `brand:${brand}`,
      label: brand,
      changes: { brands: filters.brands.filter((b) => b !== brand) },
    })
  }
  if (filters.type) {
    chips.push({ key: 'type', label: labelFor(PART_TYPES, filters.type), changes: { type: '' } })
  }
  if (filters.condition) {
    chips.push({
      key: 'condition',
      label: labelFor(CONDITIONS, filters.condition),
      changes: { condition: '' },
    })
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    const { minPrice, maxPrice } = filters
    const label =
      minPrice != null && maxPrice != null
        ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
        : minPrice != null
          ? `From ${formatPrice(minPrice)}`
          : `Up to ${formatPrice(maxPrice)}`
    chips.push({ key: 'price', label, changes: { minPrice: null, maxPrice: null } })
  }
  if (filters.inStock) chips.push({ key: 'inStock', label: 'In stock only', changes: { inStock: false } })
  for (const shopId of filters.shops) {
    chips.push({
      key: `shop:${shopId}`,
      label: shopsById[shopId]?.name ?? shopId,
      changes: { shops: filters.shops.filter((id) => id !== shopId) },
    })
  }
  if (filters.city) chips.push({ key: 'city', label: filters.city, changes: { city: '' } })

  return chips
}
