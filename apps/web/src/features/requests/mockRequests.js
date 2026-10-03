// TODO: replace with real API call
// Requests that exist when the app starts, so the chats, reports, reviews, car histories and the
// admin request monitor have something to show. Times are relative to when the app loads, so some
// are always "today". Every request has a chat (features/requests/mockChats.js).
//
// Completed requests of the test customer (customer@fastfix.test, u-2):
//   r-5  service, Kareem Auto Repair, Hyundai Accent (car-1)  - confirmed, reviewed (5 stars, with a reply)
//   r-6  service, Tulkarm Transmission Works (mechanic@), Toyota Corolla (car-2) - confirmed, not reviewed yet
//   r-7  tow, Nablus Rescue Towing (tow@)                      - confirmed, reviewed (4 stars)
//   r-8  part question, Al-Quds Auto Parts (shop@)              - completed by the shop, waiting for the
//                                                                customer to confirm
// r-3 and r-4 (tow) are open: the company marks "Arrived", then completes. The completed + confirmed
// requests of earlier customers behind the other reviews are in mockReviews.js.

import { seedReviewRequests } from './mockReviews.js'

const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
const daysAgo = (days) => hoursAgo(days * 24)
const customer = { id: 'u-2', role: 'customer', name: 'Layla Customer' }

const accent = { make: 'Hyundai', model: 'Accent', year: 2016 }
const corolla = { make: 'Toyota', model: 'Corolla', year: 2014 }

export const seedRequests = [
  {
    id: 'r-1',
    type: 'service',
    status: 'pending',
    createdAt: hoursAgo(30),
    sender: customer,
    target: { id: 'u-11', type: 'mechanic', name: 'FastLane Garage' },
    details: {
      mode: 'workshop',
      preferredAt: '2026-10-06T09:30',
      car: corolla,
      carId: 'car-2',
      problem: 'Squeaking when braking.',
      media: [],
    },
  },
  {
    id: 'r-2',
    type: 'part_question',
    status: 'pending',
    createdAt: hoursAgo(2),
    sender: { id: 'u-10', role: 'mechanic', name: 'Kareem Haddad' },
    target: { id: 'alquds-auto-parts', type: 'parts_shop', name: 'Al-Quds Auto Parts', partName: 'Front brake disc, 288 mm vented' },
    details: { partId: 'p-001', message: 'Do you have 4 in stock for pickup today?', quantity: 4 },
  },
  {
    id: 'r-3',
    type: 'tow',
    status: 'pending',
    createdAt: hoursAgo(1),
    sender: customer,
    target: { id: 'u-30', type: 'tow', name: 'Nablus Rescue Towing' },
    details: {
      pickup: 'Rafidia Street, near the hospital',
      destination: 'Kareem Auto Repair, Industrial Area',
      car: { make: 'Hyundai', model: 'Accent', year: 2013 },
      note: "Won't start.",
    },
  },
  {
    // Nablus Rescue Towing's first truck is on this job, so the company can't remove that truck.
    id: 'r-4',
    type: 'tow',
    status: 'in_progress',
    createdAt: hoursAgo(3),
    sender: customer,
    target: { id: 'u-30', type: 'tow', name: 'Nablus Rescue Towing' },
    assignedTruckId: 'u-30-truck-1',
    details: {
      pickup: 'Al Nour Street 14, Downtown Nablus',
      destination: 'Kareem Auto Repair, Industrial Area',
      car: { make: 'Toyota', model: 'Corolla', year: 2015 },
      note: 'Engine will not start.',
    },
  },
  {
    id: 'r-5',
    type: 'service',
    status: 'completed',
    createdAt: daysAgo(21),
    customerConfirmedAt: daysAgo(19.5),
    sender: customer,
    target: { id: 'u-10', type: 'mechanic', name: 'Kareem Auto Repair' },
    details: {
      mode: 'workshop',
      preferredAt: '2026-09-10T10:00',
      car: accent,
      carId: 'car-1',
      problem: 'Loud squeal for a few seconds after a cold start.',
      media: [],
      diagnosis: {
        id: 'd-seed-1',
        createdAt: daysAgo(22),
        mediaType: 'audio',
        car: accent,
        description: 'Squeal after cold start',
        fileName: 'engine-cold-start.m4a',
        observations:
          'A high-pitched squeal is loudest in the first seconds after the engine starts and fades as it keeps running.',
        possibleCauses: [
          { cause: 'Worn or glazed serpentine (accessory) belt', evidence: 'strong' },
          { cause: 'Weak automatic belt tensioner', evidence: 'moderate' },
        ],
        urgency: 'soon',
        recommendedChecks: ['Inspect the belt for cracks and glazing', 'Check the tensioner arm movement'],
        suggestedSkill: 'Engine',
      },
    },
    completion: {
      completedAt: daysAgo(20),
      confirmedDiagnosis: 'Glazed serpentine belt and a weak tensioner spring.',
      workDone: 'Replaced the serpentine belt and the automatic tensioner. Checked pulley alignment.',
      partsUsed: [
        { name: 'Serpentine belt 6PK1070', quantity: 1, priceIls: 85 },
        { name: 'Automatic belt tensioner', quantity: 1, priceIls: 210 },
      ],
      laborIls: 150,
      totalIls: 445,
    },
  },
  {
    id: 'r-6',
    type: 'service',
    status: 'completed',
    createdAt: daysAgo(6),
    customerConfirmedAt: daysAgo(3),
    sender: customer,
    target: { id: 'u-15', type: 'mechanic', name: 'Tulkarm Transmission Works' },
    details: {
      topic: 'Transmission',
      mode: 'workshop',
      preferredAt: '2026-09-27T09:00',
      car: corolla,
      carId: 'car-2',
      problem: 'Gears slip when the car is cold, and the clutch pedal feels soft.',
      media: [],
    },
    completion: {
      completedAt: daysAgo(4),
      confirmedDiagnosis: 'Worn clutch disc and a leaking clutch slave cylinder.',
      workDone: 'Replaced the clutch kit and the slave cylinder, bled the hydraulic system, road test.',
      partsUsed: [
        { name: 'Clutch kit (disc, pressure plate, bearing)', quantity: 1, priceIls: 690 },
        { name: 'Clutch slave cylinder', quantity: 1, priceIls: 180 },
        { name: 'Brake fluid DOT 4, 1 L', quantity: 1, priceIls: 35 },
      ],
      laborIls: 400,
      totalIls: 1305,
    },
  },
  {
    id: 'r-7',
    type: 'tow',
    status: 'completed',
    createdAt: daysAgo(12),
    arrivedAt: daysAgo(12),
    customerConfirmedAt: daysAgo(11.5),
    sender: customer,
    target: { id: 'u-30', type: 'tow', name: 'Nablus Rescue Towing' },
    assignedTruckId: 'u-30-truck-2',
    details: {
      pickup: 'Huwwara checkpoint road, near the gas station',
      destination: 'Kareem Auto Repair, Industrial Area',
      car: accent,
      note: 'Flat battery and a strange smell.',
    },
    completion: {
      completedAt: daysAgo(12),
      truck: { id: 'u-30-truck-2', plateNumber: '7-4513-93', type: 'wheel_lift' },
      totalIls: 180,
    },
  },
  {
    id: 'r-8',
    type: 'part_question',
    status: 'completed',
    createdAt: daysAgo(9),
    sender: customer,
    target: { id: 'alquds-auto-parts', type: 'parts_shop', name: 'Al-Quds Auto Parts', partName: 'Front brake disc, 288 mm vented' },
    details: { partId: 'p-001', message: 'Do you have 2 for a Golf 2010? I can pick them up tomorrow.', quantity: 2 },
    completion: { completedAt: daysAgo(8), note: 'Picked up 2 discs at the shop.', totalIls: 370 },
  },
  ...seedReviewRequests,
]
