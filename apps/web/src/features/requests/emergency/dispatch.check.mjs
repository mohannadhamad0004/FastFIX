// Quick manual check of the mock dispatch service: node src/features/requests/emergency/dispatch.check.mjs
// Sends a tow emergency near Nablus and prints how it moves through the statuses (takes about 1.5 minutes).
import assert from 'node:assert/strict'
import { seedUsers } from '../../../auth/mockUsers.js'
import { createDispatchService } from './mockDispatchService.js'

let data = { emergencies: [] }
const store = { read: () => data, write: (next) => (data = next) }
const accounts = { read: () => ({ users: seedUsers, sessionUserId: null }) }
const service = createDispatchService(store, { accounts })

const e = await service.createEmergency({
  kind: 'tow',
  name: 'Visitor',
  phone: '0599123456',
  location: { lat: 32.2211, lng: 35.2544, source: 'pin' },
})
assert.equal(e.status, 'searching')
assert.equal(e.offers.length, 3, 'the nearest 3 get the request')
assert.ok(e.offers.every((o) => o.distanceKm <= 15))
console.log('offers:', e.offers.map((o) => `${o.name} ${o.distanceKm.toFixed(1)} km`).join(' | '))

await assert.rejects(() => service.createEmergency({ kind: 'tow', name: 'Other', phone: '0599-123-456', location: { lat: 32.2, lng: 35.2 } }), /already have an active/)
await assert.rejects(() => service.createEmergency({ kind: 'tow', name: 'V', phone: '12', location: { lat: 32.2, lng: 35.2 } }), /phone/)

const seen = []
const started = Date.now()
const timer = setInterval(() => {
  const now = data.emergencies[0]
  if (seen.at(-1) !== now.status) {
    seen.push(now.status)
    console.log(`${((Date.now() - started) / 1000).toFixed(0)}s ${now.status}`, now.responder ? `${now.responder.company} (${now.responder.truck?.plate ?? 'mechanic'})` : '')
  }
  if (now.status === 'completed') {
    clearInterval(timer)
    assert.deepEqual(seen, ['searching', 'accepted', 'on_the_way', 'arrived', 'completed'])
    assert.equal(now.responder.sharing, false, 'location sharing stops when completed')
    assert.ok(data.emergencies[0].offers.filter((o) => o.status === 'cancelled').length === 2, 'the other offers were cancelled')
    console.log('ok')
    process.exit(0)
  }
}, 500)
