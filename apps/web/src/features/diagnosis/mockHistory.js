// TODO: replace with real API call
// A past AI report of the test customer (customer@fastfix.test, u-2), so /ai-agent isn't empty
// before the first diagnosis. Its photo is a generated placeholder (auth/mockFiles.js).

import { placePhoto } from '../../auth/mockFiles.js'
import { SCENARIOS } from './mockDiagnoses.js'

const { keywords: _keywords, ...checkEngine } = SCENARIOS.photo[0]

export const seedDiagnoses = [
  {
    id: 'd-seed-2',
    ...structuredClone(checkEngine),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    mediaType: 'photo',
    car: { make: 'Toyota', model: 'Corolla', year: 2014 },
    carId: 'car-2',
    description: 'Orange engine light came on this morning.',
    fileName: 'dashboard-check-engine.svg',
    file: placePhoto('dashboard-check-engine.svg', 'Check engine light on the dashboard', '#bc4c00'),
    userId: 'u-2',
  },
]
