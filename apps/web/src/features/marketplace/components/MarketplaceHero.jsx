import { useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '../../../components/Button.jsx'
import Input from '../../../components/Input.jsx'
import { useCart } from '../CartContext.js'
import { vehicleName } from '../format.js'
import { useVehicleDrawer } from '../VehicleDrawerContext.js'
import CatalogIcon from './CatalogIcon.jsx'
import styles from './MarketplaceHero.module.css'

// The top of /marketplace, on the same theme-aware band as the home page: a large search (part
// number or name) and "My Garage", the selected vehicle that every list is checked against.
export default function MarketplaceHero() {
  const navigate = useNavigate()
  const openVehicleDrawer = useVehicleDrawer()
  const { vehicle, service } = useCart()
  const [query, setQuery] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/marketplace/search?q=${encodeURIComponent(q)}` : '/marketplace/search')
  }

  return (
    <section className={styles.hero} aria-labelledby="marketplace-title">
      <div className={styles.intro}>
        <h1 id="marketplace-title" className={styles.title}>
          Find the right part for <span className={styles.accent}>your car</span>
        </h1>
        <p className={styles.subtitle}>Parts from every shop on FastFix, checked against your car.</p>

        <form className={styles.search} role="search" onSubmit={handleSubmit}>
          <label htmlFor="hero-search" className={styles.label}>
            Search by part number or name
          </label>
          <div className={styles.searchRow}>
            <Input
              id="hero-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. 1K0615301AA or brake pads"
              autoComplete="off"
              className={styles.searchInput}
            />
            <Button type="submit" size="lg">
              Search
            </Button>
          </div>
        </form>
      </div>

      <aside className={`${styles.garage} ${vehicle ? styles.selected : ''}`} aria-labelledby="garage-title">
        <h2 id="garage-title" className={styles.garageTitle}>
          <CatalogIcon name="car" size={22} /> My Garage
        </h2>
        {vehicle ? (
          <>
            <p className={styles.vehicleName}>{vehicleName(vehicle)}</p>
            <p className={styles.garageText}>
              <span aria-hidden="true">✓ </span>Showing parts compatible with your vehicle.
            </p>
            <div className={styles.garageActions}>
              <Button size="sm" variant="secondary" onClick={() => openVehicleDrawer?.()}>
                Change vehicle
              </Button>
              <Button size="sm" variant="ghost" onClick={() => service.setVehicle(null)}>
                Clear
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.garageText}>Choose your make and model and we only show parts that fit.</p>
            <Button fullWidth onClick={() => openVehicleDrawer?.()}>
              Select your car
            </Button>
          </>
        )}
      </aside>
    </section>
  )
}
