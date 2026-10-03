const priceFormatter = new Intl.NumberFormat('en-IL', {
  style: 'currency',
  currency: 'ILS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

// 185 -> "₪185"
export function formatPrice(valueIls) {
  return priceFormatter.format(valueIls)
}

const MAKE_SHORT_NAMES = { Volkswagen: 'VW', 'Mercedes-Benz': 'Mercedes' }

// Groups fitments by make:
// "VW Golf 2004–2013, Jetta 2005–2014; Skoda Octavia 2004–2013; Audi A3 2004–2012"
// What a part fits, for cards: 'All cars' for universal parts (oils, tools...), else formatFitments.
export const formatPartFit = (part) => (part.universalFit ? 'All cars' : formatFitments(part.fitments))

export function formatFitments(fitments) {
  const byMake = new Map()
  for (const { make, model, yearFrom, yearTo } of fitments) {
    const models = byMake.get(make) ?? []
    models.push(`${model} ${yearFrom}–${yearTo}`)
    byMake.set(make, models)
  }
  return [...byMake]
    .map(([make, models]) => `${MAKE_SHORT_NAMES[make] ?? make} ${models.join(', ')}`)
    .join('; ')
}

// { make: 'Hyundai', model: 'Accent', year: 2016 } -> "Hyundai Accent 2016" (model and year optional)
export const vehicleName = (vehicle) => [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')
