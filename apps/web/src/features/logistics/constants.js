// What tow companies offer (account.towServices) and what the customer says is wrong in a tow
// request (details.problemType). `icon` names an icon in components/TowIcon.jsx.

export const TOW_SERVICES = Object.freeze([
  { value: 'local', label: 'Local towing', icon: 'truck' },
  { value: 'heavy_duty', label: 'Heavy-duty towing', icon: 'heavy' },
  { value: 'roadside', label: 'Roadside assistance', icon: 'wrench' },
  { value: 'accident_recovery', label: 'Accident recovery', icon: 'crash' },
  { value: 'intercity', label: 'Transport between cities', icon: 'route' },
])

export const towServiceLabel = (value) => TOW_SERVICES.find((s) => s.value === value)?.label ?? value

export const TOW_PROBLEM_TYPES = Object.freeze([
  { value: 'wont_start', label: "Won't start" },
  { value: 'accident', label: 'Accident' },
  { value: 'flat_tire', label: 'Flat tire' },
  { value: 'other', label: 'Other' },
])

export const towProblemLabel = (value) => TOW_PROBLEM_TYPES.find((p) => p.value === value)?.label ?? value

export const TOW_SORTS = Object.freeze([
  { value: 'nearest', label: 'Nearest' },
  { value: 'rating', label: 'Rating' },
  { value: 'trucks', label: 'Most trucks available' },
])
