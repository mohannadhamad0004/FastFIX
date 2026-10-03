// "Hyundai Accent 2016"
export const carTitle = (car) => `${car.make} ${car.model} ${car.year}`

// "Daily driver · Hyundai Accent 2016", or just the car when it has no nickname
export const carLabel = (car) => (car.nickname ? `${car.nickname} · ${carTitle(car)}` : carTitle(car))

// 148200 -> "148,200 km"
export const formatMileage = (km) => `${Number(km).toLocaleString('en')} km`
