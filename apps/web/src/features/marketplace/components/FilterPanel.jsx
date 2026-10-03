import Button from '../../../components/Button.jsx'
import Input from '../../../components/Input.jsx'
import Select from '../../../components/Select.jsx'
import { CATEGORIES, CITIES, CONDITIONS, PART_TYPES } from '../constants.js'
import styles from './FilterPanel.module.css'

const toggle = (list, value) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]

const toNumberOrNull = (value) => (value === '' ? null : Number(value))

export default function FilterPanel({ filters, onChange, onClear, vehicles, brands, shops }) {
  const makeEntry = vehicles.find((vehicle) => vehicle.make === filters.make)
  const modelEntry = makeEntry?.models.find((model) => model.name === filters.model)
  const years = modelEntry
    ? Array.from(
        { length: modelEntry.yearTo - modelEntry.yearFrom + 1 },
        (_, i) => modelEntry.yearTo - i,
      )
    : []

  return (
    <div className={styles.panel}>
      <fieldset className={styles.group}>
        <legend className={styles.legend}>Vehicle</legend>
        <Select size="sm"
          aria-label="Make"
          value={filters.make}
          onChange={(event) => onChange({ make: event.target.value, model: '', year: null })}
        >
          <option value="">Any make</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.make} value={vehicle.make}>
              {vehicle.make}
            </option>
          ))}
        </Select>
        <Select size="sm"
          aria-label="Model"
          value={filters.model}
          disabled={!makeEntry}
          onChange={(event) => onChange({ model: event.target.value, year: null })}
        >
          <option value="">{makeEntry ? 'Any model' : 'Choose a make first'}</option>
          {makeEntry?.models.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </Select>
        <Select size="sm"
          aria-label="Year"
          value={filters.year ?? ''}
          disabled={!modelEntry}
          onChange={(event) => onChange({ year: toNumberOrNull(event.target.value) })}
        >
          <option value="">{modelEntry ? 'Any year' : 'Choose a model first'}</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </fieldset>

      <label className={styles.group}>
        <span className={styles.legend}>Category</span>
        <Select size="sm" value={filters.category} onChange={(event) => onChange({ category: event.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </label>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Brand</legend>
        <div className={styles.checkList}>
          {brands.map((brand) => (
            <label key={brand} className={styles.check}>
              <input
                type="checkbox"
                checked={filters.brands.includes(brand)}
                onChange={() => onChange({ brands: toggle(filters.brands, brand) })}
              />
              {brand}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Type</legend>
        {[{ value: '', label: 'Any' }, ...PART_TYPES].map((option) => (
          <label key={option.value || 'any'} className={styles.check}>
            <input
              type="radio"
              name="part-type"
              checked={filters.type === option.value}
              onChange={() => onChange({ type: option.value })}
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <label className={styles.group}>
        <span className={styles.legend}>Condition</span>
        <Select size="sm" value={filters.condition} onChange={(event) => onChange({ condition: event.target.value })}>
          <option value="">Any condition</option>
          {CONDITIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </label>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Price (₪)</legend>
        <div className={styles.priceRow}>
          <Input
            size="sm"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            aria-label="Minimum price in shekels"
            value={filters.minPrice ?? ''}
            onChange={(event) => onChange({ minPrice: toNumberOrNull(event.target.value) })}
          />
          <span aria-hidden="true">–</span>
          <Input
            size="sm"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            aria-label="Maximum price in shekels"
            value={filters.maxPrice ?? ''}
            onChange={(event) => onChange({ maxPrice: toNumberOrNull(event.target.value) })}
          />
        </div>
      </fieldset>

      <label className={`${styles.group} ${styles.toggle}`}>
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(event) => onChange({ inStock: event.target.checked })}
        />
        <span>In stock only</span>
      </label>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Shop</legend>
        <div className={styles.checkList}>
          {shops.map((shop) => (
            <label key={shop.id} className={styles.check}>
              <input
                type="checkbox"
                checked={filters.shops.includes(shop.id)}
                onChange={() => onChange({ shops: toggle(filters.shops, shop.id) })}
              />
              {shop.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label className={styles.group}>
        <span className={styles.legend}>City</span>
        <Select size="sm" value={filters.city} onChange={(event) => onChange({ city: event.target.value })}>
          <option value="">All cities</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
      </label>

      <Button variant="secondary" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  )
}
