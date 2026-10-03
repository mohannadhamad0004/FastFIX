// TODO: replace with real API call
// Chat messages when the app starts, for the requests in mockRequests.js (every request has a
// chat). `reads` is when each participant last opened each chat; newer messages from the other
// side count as unread. The test customer (u-2) starts with unread messages from Nablus Rescue
// Towing (r-4) and Tulkarm Transmission Works (r-6); the shop (shop@) has one from Kareem (r-2).

import { placePhoto } from '../../auth/mockFiles.js'

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
const daysAgo = (days) => hoursAgo(days * 24)

let n = 0
const message = (requestId, senderId, text, createdAt, photos = []) => {
  n += 1
  return { id: `m-${n}`, requestId, senderId, text, photos, createdAt }
}

export const seedMessages = [
  // r-1: Layla -> FastLane Garage (pending)
  message('r-1', 'u-2', 'Hi, the brakes squeak every time I stop. Is Monday morning OK?', hoursAgo(29.5)),
  message('r-1', 'u-11', 'Monday 9:30 works. Bring the car to the Ring Road workshop.', hoursAgo(28)),

  // r-2: Kareem (mechanic) -> Al-Quds Auto Parts (pending)
  message('r-2', 'u-10', 'Need 4 discs for a customer Golf, can I pick them up at 4?', hoursAgo(1.9)),

  // r-3: Layla -> Nablus Rescue Towing (pending)
  message('r-3', 'u-2', "The car is parked near the hospital entrance, it won't start.", hoursAgo(0.9)),

  // r-4: Layla -> Nablus Rescue Towing (in progress)
  message('r-4', 'u-30', 'Our flatbed 7-4512-93 is on the way, about 20 minutes.', hoursAgo(2.8)),
  message('r-4', 'u-2', 'Thank you, I am waiting next to the car.', hoursAgo(2.7)),
  message('r-4', 'u-30', 'Driver is 5 minutes away.', hoursAgo(2.5)),

  // r-5: Layla -> Kareem Auto Repair (completed, reviewed)
  message('r-5', 'u-2', 'I attached the AI report about the squeal. Can you check it Thursday?', daysAgo(21)),
  message('r-5', 'u-10', 'Yes, bring it at 10. Sounds like the belt.', daysAgo(21)),
  message(
    'r-5',
    'u-10',
    'Here is the old belt, fully glazed. The tensioner was weak too, both are replaced.',
    daysAgo(20),
    [placePhoto('old-serpentine-belt.svg', 'Old serpentine belt', '#57606a')],
  ),
  message('r-5', 'u-2', 'Great, no more squeal. Thanks!', daysAgo(20)),

  // r-6: Layla -> Tulkarm Transmission Works (completed, not reviewed yet)
  message('r-6', 'u-2', 'The gears slip when the car is cold. Can you have a look this week?', daysAgo(6)),
  message('r-6', 'u-15', 'Bring it Saturday at 9, we will test drive it cold.', daysAgo(6)),
  message('r-6', 'u-15', 'All done: new clutch kit and slave cylinder. You can pick it up.', daysAgo(4)),

  // r-7: Layla -> Nablus Rescue Towing (completed, reviewed)
  message('r-7', 'u-2', 'Stuck near the Huwwara gas station, the battery is dead.', daysAgo(12)),
  message('r-7', 'u-30', 'Wheel-lift truck coming, 25 minutes.', daysAgo(12)),

  // r-8: Layla -> Al-Quds Auto Parts (completed, not reviewed yet)
  message('r-8', 'u-2', 'Do you have 2 front discs for a Golf 2010?', daysAgo(9)),
  message('r-8', 'alquds-auto-parts', 'Yes, Bosch 288 mm, 185 ₪ each. We keep them for you until tomorrow.', daysAgo(9)),
]

// { [requestId]: { [userId]: ISO date last read } }
export const seedReads = {
  'r-1': { 'u-2': hoursAgo(27), 'u-11': hoursAgo(29) },
  'r-2': {},
  'r-3': { 'u-2': hoursAgo(0.9) },
  'r-4': { 'u-2': hoursAgo(2.7), 'u-30': hoursAgo(2.6) },
  'r-5': { 'u-2': daysAgo(19), 'u-10': daysAgo(19) },
  'r-6': { 'u-2': daysAgo(5), 'u-15': daysAgo(4) },
  'r-7': { 'u-2': daysAgo(11), 'u-30': daysAgo(11) },
  'r-8': { 'u-2': daysAgo(8), 'alquds-auto-parts': daysAgo(8) },
}
