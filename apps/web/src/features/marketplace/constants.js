// Fixed option lists for the marketplace filters.

export const CATEGORIES = [
  'Engine',
  'Brakes',
  'Suspension',
  'Steering',
  'Electrical',
  'Lighting',
  'Body',
  'Filters',
  'Cooling',
  'Transmission',
  'Accessories',
  'Tires & Wheels',
  'Oils & Fluids',
  'Tools',
]

export const CITIES = ['Nablus', 'Ramallah', 'Jenin', 'Tulkarm', 'Hebron', 'Bethlehem']

export const PART_TYPES = [
  { value: 'oem', label: 'Genuine OEM' },
  { value: 'aftermarket', label: 'Aftermarket' },
]

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'newest', label: 'Newest' },
]

export const LOW_STOCK_THRESHOLD = 3
