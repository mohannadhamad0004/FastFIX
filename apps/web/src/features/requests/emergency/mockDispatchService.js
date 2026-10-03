// TODO: replace with backend + WebSockets
//
// The mock dispatch service for emergency requests. Every function returns a Promise, like the real
// API will; the "server" side (offers, timeouts, simulated drivers) runs on timers in this file.
//
//   customer: createEmergency, getEmergency, cancelEmergency, sendMessage
//   responder (tow company or mechanic): acceptOffer, declineOffer, setStatus, updateResponderLocation
//   admin: getAllEmergencies
//
// Dispatch: the nearest 3 available responders within 15 km get the request at once (marked
// emergency, highest priority). The first to accept gets it and the other offers are cancelled. Nobody
// in 60 s: widen to 30 km and the next 3, then 50 km; then "unavailable" with the nearest companies'
// phone numbers. Simulated drivers (switch off with setSimulation(false)) accept after 5-15 s and
// drive to the customer.
//
// Mock: emergencies live in EmergencyProvider's React state (memory only). The service gets the raw
// accounts store, the way the api reads the database. The api must apply the same rules: who may
// accept, one active emergency per user or phone number, and customer contact details only
// after acceptance.

import { isApprovedTruck } from '../../../auth/reviewItems.js'
import { haversineKm } from '../../logistics/geo.js'
import { ACTIVE_EMERGENCY, DISPATCH, EMERGENCY_STATUS as S } from './constants.js'

/** @typedef {import('./types.js').Emergency} Emergency */

export class EmergencyError extends Error {
  constructor(message, field = null) {
    super(message)
    this.name = 'EmergencyError'
    this.field = field
  }
}

const copy = (value) => structuredClone(value)
const digits = (phone) => String(phone ?? '').replace(/\D/g, '')
const random = (min, max) => min + Math.random() * (max - min)
const isActive = (e) => ACTIVE_EMERGENCY.includes(e.status)

// A made-up driver name for each tow company (the mock accounts only have a company name).
const DRIVERS = ['Samer', 'Hasan', 'Tamer', 'Walid', 'Bassam', 'Jamal', 'Nidal', 'Ziad']
const driverName = (userId) => DRIVERS[Number(userId.replace(/\D/g, '')) % DRIVERS.length]

const AUTO_REPLIES = [
  'Got it, I am on my way.',
  'Okay, stay with your car and keep your hazard lights on.',
  'I can see your location. See you soon.',
]

const etaMinutes = (km) => Math.max(1, Math.ceil((km / DISPATCH.speedKmh) * 60))
const ORDER = { accepted: 1, on_the_way: 2, arrived: 3, completed: 4 }

/**
 * @param {{ read: () => { emergencies: Emergency[] }, write: (next: { emergencies: Emergency[] }) => void }} store
 * @param {{ accounts: { read: () => { users: Object[], sessionUserId: string | null } } }} stores  raw mock stores
 */
export function createDispatchService(store, stores) {
  let simulate = true
  const timers = new Map() // emergency id -> timeout / interval ids, cleared when it ends

  // --- helpers --------------------------------------------------------------------------------

  const users = () => stores.accounts.read().users
  const currentUser = () => {
    const { users: all, sessionUserId } = stores.accounts.read()
    return all.find((u) => u.id === sessionUserId) ?? null
  }
  const find = (id) => store.read().emergencies.find((e) => e.id === id) ?? null

  function update(id, change) {
    const { emergencies } = store.read()
    store.write({
      emergencies: emergencies.map((e) => (e.id === id ? { ...e, ...(typeof change === 'function' ? change(e) : change) } : e)),
    })
    return find(id)
  }

  function later(id, ms, fn) {
    const handle = setTimeout(fn, ms)
    timers.set(id, [...(timers.get(id) ?? []), handle])
    return handle
  }

  function stopTimers(id) {
    for (const handle of timers.get(id) ?? []) {
      clearTimeout(handle)
      clearInterval(handle)
    }
    timers.delete(id)
  }

  const nextId = () => `e-${store.read().emergencies.reduce((max, e) => Math.max(max, Number(e.id.slice(2)) || 0), 0) + 1}`

  // Responders already on an emergency can't be offered another one.
  const busyIds = () => new Set(store.read().emergencies.filter((e) => isActive(e) && e.responder).map((e) => e.responder.id))

  /** Available responders for `kind`, nearest first: [{ user, distanceKm }]. */
  function candidates(kind, origin, radiusKm, excluded = new Set()) {
    const busy = busyIds()
    return users()
      .filter((u) => u.status === 'approved' && !u.suspended && u.base && !busy.has(u.id) && !excluded.has(u.id))
      .filter((u) =>
        kind === 'tow'
          ? u.role === 'tow' && u.trucks?.some((t) => isApprovedTruck(t) && t.status === 'available')
          : u.role === 'mechanic' && u.serviceModes?.includes('on_site'),
      )
      .map((user) => ({ user, distanceKm: haversineKm(origin, user.base) }))
      .filter((c) => c.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }

  const responderName = (user) => (user.role === 'mechanic' ? user.workshopName : user.name)

  // --- dispatch -------------------------------------------------------------------------------

  function dispatchWave(id, waveIndex) {
    const e = find(id)
    if (!e || e.status !== S.SEARCHING) return
    if (waveIndex >= DISPATCH.waves.length) {
      stopTimers(id)
      update(id, {
        status: S.UNAVAILABLE,
        offers: e.offers.map((o) => (o.status === 'pending' ? { ...o, status: 'expired' } : o)),
        nearest: candidates(e.kind, e.location, Infinity)
          .slice(0, 3)
          .map(({ user, distanceKm }) => ({ id: user.id, name: responderName(user), phone: user.phone, distanceKm })),
      })
      return
    }

    const { radiusKm } = DISPATCH.waves[waveIndex]
    const already = new Set(e.offers.map((o) => o.responderId))
    const chosen = candidates(e.kind, e.location, radiusKm, already).slice(0, DISPATCH.perWave)
    const sentAt = Date.now()
    const offers = chosen.map(({ user, distanceKm }) => ({
      responderId: user.id,
      role: user.role,
      name: responderName(user),
      distanceKm,
      wave: waveIndex + 1,
      sentAt: new Date(sentAt).toISOString(),
      expiresAt: new Date(sentAt + DISPATCH.waveMs).toISOString(),
      status: 'pending',
    }))
    update(id, {
      wave: waveIndex + 1,
      radiusKm,
      offers: [...e.offers.map((o) => (o.status === 'pending' ? { ...o, status: 'expired' } : o)), ...offers],
    })

    // Nobody to offer in this wave: go straight to the next one. Otherwise wait for an answer.
    later(id, offers.length === 0 ? 0 : DISPATCH.waveMs, () => dispatchWave(id, waveIndex + 1))
    if (simulate && offers.length > 0) {
      const lucky = offers[Math.floor(Math.random() * offers.length)]
      later(id, random(...DISPATCH.simulatedAcceptMs), () => accept(id, lucky.responderId, true))
    }
  }

  function accept(id, responderId, simulated = false) {
    const e = find(id)
    const offer = e?.offers.find((o) => o.responderId === responderId && o.status === 'pending')
    if (!e || e.status !== S.SEARCHING || !offer) return null // someone else was first, or it ended
    const user = users().find((u) => u.id === responderId)
    const truck = user.role === 'tow' ? user.trucks.find((t) => isApprovedTruck(t) && t.status === 'available') : null
    stopTimers(id)
    const updated = update(id, {
      status: S.ACCEPTED,
      acceptedAt: new Date().toISOString(),
      offers: e.offers.map((o) => (o.responderId === responderId ? { ...o, status: 'accepted' } : o.status === 'pending' ? { ...o, status: 'cancelled' } : o)),
      responder: {
        id: user.id,
        role: user.role,
        company: responderName(user),
        name: user.role === 'mechanic' ? user.name : driverName(user.id),
        phone: user.phone,
        truck: truck ? { type: truck.type, plate: truck.plateNumber } : null,
        location: { ...user.base },
        simulated,
        sharing: true, // location sharing: on while the job is active
        lastLiveAt: null,
      },
      etaMinutes: etaMinutes(haversineKm(user.base, e.location)),
    })
    // A simulated driver sets off after 3 s
    if (simulated) {
      later(id, 3_000, () => {
        if (find(id)?.status === S.ACCEPTED) setStatus(id, S.ON_THE_WAY, true)
      })
    }
    return updated
  }

  // Moves the responder towards the customer every tick, unless a real location came in recently.
  function startMovement(id) {
    const e = find(id)
    const total = haversineKm(e.responder.location, e.location)
    const stepKm = Math.max(0.02, total / (DISPATCH.simulatedTripMs / DISPATCH.tickMs))
    const handle = setInterval(() => {
      const current = find(id)
      if (!current || current.status !== S.ON_THE_WAY) {
        clearInterval(handle)
        return
      }
      if (current.responder.lastLiveAt && Date.now() - current.responder.lastLiveAt < DISPATCH.liveStaleMs) return
      const here = current.responder.location
      const remaining = haversineKm(here, current.location)
      const fraction = remaining <= stepKm ? 1 : stepKm / remaining
      const next = { lat: here.lat + (current.location.lat - here.lat) * fraction, lng: here.lng + (current.location.lng - here.lng) * fraction }
      update(id, (old) => ({ responder: { ...old.responder, location: next }, etaMinutes: etaMinutes(haversineKm(next, current.location)) }))
      if (fraction === 1) {
        clearInterval(handle)
        if (current.responder.simulated) setStatus(id, S.ARRIVED, true)
      }
    }, DISPATCH.tickMs)
    timers.set(id, [...(timers.get(id) ?? []), handle])
  }

  /** `trusted`: called by the simulated driver itself; otherwise it must be the logged-in responder. */
  function setStatus(id, status, trusted = false) {
    const e = find(id)
    if (!e) throw new EmergencyError('This emergency no longer exists.')
    if (!trusted && (!currentUser() || currentUser().id !== e.responder?.id)) {
      throw new EmergencyError('Only the responder who accepted this emergency can change its status.')
    }
    if (!isActive(e) || e.status === S.SEARCHING) throw new EmergencyError('This emergency is not active.')
    if (!(status in ORDER) || ORDER[status] <= ORDER[e.status]) throw new EmergencyError('That step is already done.')
    if (status === S.COMPLETED && e.status === S.ACCEPTED) throw new EmergencyError('Mark "On the way" and "Arrived" first.')

    const stamp = { on_the_way: 'onTheWayAt', arrived: 'arrivedAt', completed: 'completedAt' }[status]
    const ended = status === S.COMPLETED
    if (ended) stopTimers(id)
    const updated = update(id, (old) => ({
      status,
      [stamp]: new Date().toISOString(),
      // Location sharing stops when the job is completed
      responder: ended ? { ...old.responder, sharing: false } : old.responder,
    }))
    if (status === S.ON_THE_WAY) startMovement(id)
    if (status === S.ARRIVED && e.responder.simulated) later(id, DISPATCH.simulatedCompleteMs, () => setStatus(id, S.COMPLETED, true))
    return updated
  }

  // --- customer -------------------------------------------------------------------------------

  /**
   * Sends an emergency and starts the search.
   * @param {Object} data  { kind: 'tow' | 'mechanic', location: { lat, lng, source }, landmark?, phone, name?,
   *   car?: { make, model, year? }, carId?, problemType?, note? }. Logged-in customers send as
   *   themselves; visitors give a name and phone number only.
   * @returns {Promise<Emergency>}
   */
  async function createEmergency(data) {
    const user = currentUser()
    if (user && user.role !== 'customer') throw new EmergencyError('Only customers can send an emergency.')
    if (!['tow', 'mechanic'].includes(data.kind)) throw new EmergencyError('Choose a tow or a mechanic.', 'kind')
    const { lat, lng } = data.location ?? {}
    if (!(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) {
      throw new EmergencyError('We need your location: share it or drop a pin on the map.', 'location')
    }
    const phone = String(data.phone ?? '').trim()
    if (digits(phone).length < 7) throw new EmergencyError('Enter a phone number the driver can call.', 'phone')
    const name = user ? user.name : String(data.name ?? '').trim()
    if (!name) throw new EmergencyError('Enter your name.', 'name')

    const duplicate = store
      .read()
      .emergencies.find((e) => isActive(e) && ((user && e.customer.userId === user.id) || digits(e.customer.phone) === digits(phone)))
    if (duplicate) throw new EmergencyError('You already have an active emergency. Finish or cancel it first.')

    const emergency = {
      id: nextId(),
      kind: data.kind,
      status: S.SEARCHING,
      createdAt: new Date().toISOString(),
      customer: { userId: user?.id ?? null, name, phone },
      location: { lat, lng },
      locationSource: data.location.source ?? 'pin',
      landmark: String(data.landmark ?? '').trim(),
      details: {
        car: data.car ?? null,
        carId: data.carId ?? null,
        problemType: data.problemType ?? 'other',
        note: String(data.note ?? '').trim(),
      },
      priority: 'emergency',
      wave: 0,
      radiusKm: 0,
      offers: [],
      responder: null,
      messages: [],
    }
    store.write({ emergencies: [...store.read().emergencies, emergency] })
    dispatchWave(emergency.id, 0)
    return copy(find(emergency.id))
  }

  /** @returns {Promise<Emergency | null>} */
  async function getEmergency(id) {
    const e = find(id)
    return e ? copy(e) : null
  }

  /** The customer cancels. Everyone who got the offer is told, and location sharing stops. */
  async function cancelEmergency(id) {
    const e = find(id)
    if (!e || !isActive(e)) throw new EmergencyError('This emergency is not active.')
    stopTimers(id)
    return copy(
      update(id, {
        status: S.CANCELLED,
        cancelledAt: new Date().toISOString(),
        offers: e.offers.map((o) => (o.status === 'pending' ? { ...o, status: 'cancelled' } : o)),
        responder: e.responder ? { ...e.responder, sharing: false } : null,
      }),
    )
  }

  /** A message from the customer or from the responder who accepted (chat on the emergency screen). */
  async function sendMessage(id, { text = '', photos = [] }) {
    const e = find(id)
    if (!e || ![S.ACCEPTED, S.ON_THE_WAY, S.ARRIVED].includes(e.status)) throw new EmergencyError('The chat opens when someone accepts.')
    if (!text.trim() && photos.length === 0) throw new EmergencyError('Write a message or add a photo.')
    const user = currentUser()
    const side = user && user.id === e.responder?.id ? 'responder' : 'customer'
    const message = { id: `${id}-m${e.messages.length + 1}`, senderId: side, text: text.trim(), photos, createdAt: new Date().toISOString() }
    update(id, { messages: [...e.messages, message] })
    if (side === 'customer' && e.responder.simulated) {
      later(id, 2_500, () => {
        const now = find(id)
        if (!now || !isActive(now)) return
        const reply = {
          id: `${id}-m${now.messages.length + 1}`,
          senderId: 'responder',
          text: AUTO_REPLIES[now.messages.length % AUTO_REPLIES.length],
          photos: [],
          createdAt: new Date().toISOString(),
        }
        update(id, { messages: [...now.messages, reply] })
      })
    }
    return { ...message, photos: [...photos] }
  }

  // --- responder ------------------------------------------------------------------------------

  function requireResponder() {
    const user = currentUser()
    if (!user || !['tow', 'mechanic'].includes(user.role)) throw new EmergencyError('Only tow companies and mechanics can answer emergencies.')
    return user
  }

  /** The first responder to accept gets the emergency. @returns {Promise<Emergency>} */
  async function acceptOffer(id) {
    const e = accept(id, requireResponder().id)
    if (!e) throw new EmergencyError('Too late: this emergency was taken or is no longer open.')
    return copy(e)
  }

  async function declineOffer(id) {
    const user = requireResponder()
    const e = find(id)
    if (!e) return
    update(id, { offers: e.offers.map((o) => (o.responderId === user.id && o.status === 'pending' ? { ...o, status: 'declined' } : o)) })
  }

  /** "On the way", "Arrived" or "Completed", by the responder who accepted. */
  async function setResponderStatus(id, status) {
    return copy(setStatus(id, status))
  }

  /** The responder's real position (their phone), shared with the customer while the job is active. */
  async function updateResponderLocation(id, { lat, lng }) {
    const user = requireResponder()
    const e = find(id)
    if (!e || e.responder?.id !== user.id || !isActive(e) || !e.responder.sharing) return null
    return copy(
      update(id, (old) => ({
        responder: { ...old.responder, location: { lat, lng }, lastLiveAt: Date.now() },
        etaMinutes: etaMinutes(haversineKm({ lat, lng }, old.location)),
      })),
    )
  }

  // --- admin ----------------------------------------------------------------------------------

  /** Every emergency, newest first (the api: admins only). */
  async function getAllEmergencies() {
    if (currentUser()?.role !== 'admin') throw new EmergencyError('Only admins can see every emergency.')
    return copy([...store.read().emergencies].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  }

  /** Demo switch: simulated drivers accept and drive by themselves. */
  function setSimulation(on) {
    simulate = Boolean(on)
  }
  const isSimulating = () => simulate

  return {
    createEmergency,
    getEmergency,
    cancelEmergency,
    sendMessage,
    acceptOffer,
    declineOffer,
    setStatus: setResponderStatus,
    updateResponderLocation,
    getAllEmergencies,
    setSimulation,
    isSimulating,
  }
}
