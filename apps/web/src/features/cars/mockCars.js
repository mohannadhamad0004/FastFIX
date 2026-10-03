// TODO: replace with real API call
// Registered cars when the app starts. The test customer (customer@fastfix.test, u-2) has two;
// everyone else starts with none. Their completed service requests (features/requests/mockRequests.js)
// point at these ids, so /my-cars/car-1 and car-2 have a maintenance history.

import { placePhoto } from '../../auth/mockFiles.js'

export const seedCars = [
  {
    id: 'car-1',
    ownerId: 'u-2',
    nickname: 'Daily driver',
    make: 'Hyundai',
    model: 'Accent',
    year: 2016,
    mileageKm: 148200,
    vin: 'KMHCT41DAGU123456',
    photo: placePhoto('car-1-hyundai-accent.svg', 'Hyundai Accent 2016', '#1f6feb'),
    createdAt: '2026-09-02T09:10:00.000Z',
  },
  {
    id: 'car-2',
    ownerId: 'u-2',
    nickname: 'Family car',
    make: 'Toyota',
    model: 'Corolla',
    year: 2014,
    mileageKm: 201500,
    vin: '',
    photo: null,
    createdAt: '2026-09-02T09:12:00.000Z',
  },
]
