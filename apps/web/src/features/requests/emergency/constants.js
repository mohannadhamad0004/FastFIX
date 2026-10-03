// Emergency requests: a customer on the road asks for a tow truck or a roadside mechanic and the
// dispatch service offers the job to the nearest ones.

export const EMERGENCY_KINDS = Object.freeze([
  { value: 'tow', label: 'I need a tow', short: 'Tow truck', icon: 'truck' },
  { value: 'mechanic', label: 'I need a mechanic on the road', short: 'Roadside mechanic', icon: 'wrench' },
])

export const emergencyKindLabel = (kind) => EMERGENCY_KINDS.find((k) => k.value === kind)?.short ?? kind

export const EMERGENCY_PROBLEMS = Object.freeze([
  { value: 'wont_start', label: "Won't start" },
  { value: 'flat_tire', label: 'Flat tire' },
  { value: 'accident', label: 'Accident' },
  { value: 'overheating', label: 'Overheating' },
  { value: 'out_of_fuel', label: 'Out of fuel' },
  { value: 'other', label: 'Other' },
])

export const emergencyProblemLabel = (value) => EMERGENCY_PROBLEMS.find((p) => p.value === value)?.label ?? value

// searching -> accepted -> on_the_way -> arrived -> completed. A request can also end cancelled
// (the customer) or unavailable (nobody accepted after the widest search).
export const EMERGENCY_STATUS = Object.freeze({
  SEARCHING: 'searching',
  ACCEPTED: 'accepted',
  ON_THE_WAY: 'on_the_way',
  ARRIVED: 'arrived',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  UNAVAILABLE: 'unavailable',
})

export const ACTIVE_EMERGENCY = Object.freeze(['searching', 'accepted', 'on_the_way', 'arrived'])

export const EMERGENCY_STEPS = Object.freeze([
  { value: 'searching', label: 'Searching' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'on_the_way', label: 'On the way' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'completed', label: 'Completed' },
])

export const EMERGENCY_STATUS_LABELS = Object.freeze({
  searching: 'Searching',
  accepted: 'Accepted',
  on_the_way: 'On the way',
  arrived: 'Arrived',
  completed: 'Completed',
  cancelled: 'Cancelled',
  unavailable: 'No one available',
})

export const SAFETY_NOTICE = 'If anyone is injured, call 101 (ambulance) first. Police: 100.'

// TODO: replace with backend + WebSockets. These timings drive the mock dispatch service.
export const DISPATCH = Object.freeze({
  waves: [{ radiusKm: 15 }, { radiusKm: 30 }, { radiusKm: 50 }],
  perWave: 3, // the nearest 3 get the request at once
  waveMs: 60_000, // nobody accepted in this time: widen the search
  simulatedAcceptMs: [5_000, 15_000], // a simulated driver accepts after a random time in this range
  simulatedTripMs: 45_000, // a simulated driver takes this long to arrive, whatever the distance
  simulatedCompleteMs: 12_000, // and finishes this long after arriving
  speedKmh: 40, // for the arrival estimate
  tickMs: 1_000, // movement update
  liveStaleMs: 10_000, // a real location update this recent stops the simulated movement
})

/** Google Maps directions to the exact coordinates; opens the Maps app on phones, no API key needed. */
export const navigateUrl = ({ lat, lng }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
