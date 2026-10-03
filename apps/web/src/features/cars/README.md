# cars

The customer's cars (nickname, make, model, year, mileage, optional VIN and photo) and their
maintenance history. Customers only.

| Path | Purpose |
| --- | --- |
| `pages/MyCarsPage.jsx` | `/my-cars` - list, add, edit, delete |
| `pages/CarDetailsPage.jsx` | `/my-cars/:carId` - the car and its maintenance history (completed service requests for it: date, mechanic, confirmed diagnosis, work done, parts, cost) |
| `components/CarForm.jsx` | Add / edit form |
| `components/CarPhoto.jsx`, `components/DeleteCarDialog.jsx` | Photo or placeholder; delete confirmation |
| `carsService.js` | `getMyCars`, `getCar`, `addCar`, `updateCar`, `deleteCar`, `carErrors` - mock |
| `CarsProvider.jsx` / `CarsContext.js` | State, `useCarsService()`, `useCarsQuery()` |
| `useMyCars.js` | The logged-in customer's cars - used by `/my-cars` and the car pickers in the diagnosis card and "Request service" |
| `mockCars.js` | Seed: the test customer (u-2) has a Hyundai Accent (car-1) and a Toyota Corolla (car-2) |
| `format.js` | `carTitle`, `carLabel`, `formatMileage` |
| `types.js` | JSDoc `Car` |

**History:** a service request sent with one of these cars keeps its `details.carId`; once the
mechanic completes it, `requestsService.getCarHistory(carId)` lists it. Deleting a car keeps its
past requests and reports. **Mock:** memory only - a page reload resets the cars.
