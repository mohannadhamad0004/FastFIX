import { useId, useState } from 'react'
import Button from '../../../components/Button.jsx'
import { FieldError } from '../../../components/FormField.jsx'
import Input from '../../../components/Input.jsx'
import Notice from '../../../components/Notice.jsx'
import SearchBar from '../../../components/SearchBar.jsx'
import Tabs, { TabPanel } from '../../../components/Tabs.jsx'
import { CITIES, findCity } from '../cities.js'
import TowIcon from './TowIcon.jsx'
import styles from './LocationSearchHero.module.css'

/**
 * The hero of /tow-companies and /mechanics: headline, subtitle and the "Search by" card with three
 * tabs - a text search, a city (searchable list of Palestinian cities and towns) and "My location"
 * (the browser's geolocation). It only reports what the customer chose; the page does the
 * searching. `children` go under the card (service filters, an AI banner, ...).
 * @param {Object} props
 * @param {React.ReactNode} props.title            the headline (may contain a styled span: see `accent`)
 * @param {string} props.subtitle
 * @param {string} props.idPrefix                  unique per page, for the tab ids
 * @param {{ value: string, label: string }} props.textMode   the text-search tab, e.g. { value: 'name', label: 'Company name' }
 * @param {string} props.textPlaceholder
 * @param {string} props.textLabel                 screen reader label of the text field
 * @param {React.ReactNode} [props.textExtra]      under the text field (e.g. symptom suggestions)
 * @param {string} props.mode                      the chosen tab: textMode.value, 'city' or 'location'
 * @param {(mode: string) => void} props.onModeChange
 * @param {string} props.city                      the searched city ('' for none)
 * @param {(city: string) => void} props.onCityChange
 * @param {string} props.query
 * @param {(query: string) => void} props.onQueryChange
 * @param {boolean} props.locating                 waiting for the browser's location
 * @param {boolean} props.located                  the browser's location is known
 * @param {string | null} props.locationError      why the location failed, for the customer
 * @param {() => void} props.onLocate
 */
export default function LocationSearchHero({
  title,
  subtitle,
  idPrefix,
  textMode,
  textPlaceholder,
  textLabel,
  textExtra = null,
  mode,
  onModeChange,
  city,
  onCityChange,
  query,
  onQueryChange,
  locating,
  located,
  locationError,
  onLocate,
  children,
}) {
  const modes = [textMode, { value: 'city', label: 'City' }, { value: 'location', label: 'My location' }]
  // The tabs read "Problem or skill / City / My location": the text tab comes first when it is a problem search
  const ordered = textMode.value === 'problem' ? modes : [modes[1], modes[0], modes[2]]
  const listId = useId()
  const [cityText, setCityText] = useState(city)
  const [cityError, setCityError] = useState('')

  // The city changed from outside (a city in "Tow companies by city"): show it in the field.
  const [seenCity, setSeenCity] = useState(city)
  if (city !== seenCity) {
    setSeenCity(city)
    setCityText(city)
  }

  function changeCityText(text) {
    setCityText(text)
    setCityError('')
    // Picking a city from the list sets it right away; clearing the field clears the search.
    const match = findCity(text)
    if (match) onCityChange(match.name)
    else if (!text.trim()) onCityChange('')
  }

  function search() {
    if (mode === 'city') {
      const match = findCity(cityText)
      if (match) onCityChange(match.name)
      else setCityError(cityText.trim() ? "We don't know that city yet. Pick one from the list." : 'Choose a city.')
    } else if (mode === 'location' && !located) onLocate()
    document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className={styles.hero} aria-labelledby={`${idPrefix}-title`}>
      <h1 id={`${idPrefix}-title`} className={styles.title}>
        {title}
      </h1>
      <p className={styles.subtitle}>{subtitle}</p>

      <div className={styles.card}>
        <p className={styles.cardLabel}>Search by</p>
        <Tabs tabs={ordered} value={mode} onChange={onModeChange} label="Search by" idPrefix={idPrefix} variant="pills" fullWidth />
        <div className={styles.searchRow}>
          <TabPanel idPrefix={idPrefix} value={mode} className={styles.panel}>
            {mode === 'city' && (
              <div className={styles.field}>
                <label htmlFor={`${idPrefix}-city`} className={styles.visuallyHidden}>
                  City or town
                </label>
                <Input
                  id={`${idPrefix}-city`}
                  list={listId}
                  value={cityText}
                  onChange={(event) => changeCityText(event.target.value)}
                  placeholder="Type or pick a city, e.g. Nablus"
                  autoComplete="off"
                  invalid={Boolean(cityError)}
                  aria-describedby={cityError ? `${idPrefix}-city-error` : undefined}
                />
                <datalist id={listId}>
                  {CITIES.map((item) => (
                    <option key={item.name} value={item.name} />
                  ))}
                </datalist>
                <FieldError id={`${idPrefix}-city-error`}>{cityError}</FieldError>
              </div>
            )}
            {mode === textMode.value && (
              <div className={styles.field}>
                <SearchBar id={`${idPrefix}-text`} label={textLabel} placeholder={textPlaceholder} value={query} onChange={onQueryChange} />
                {textExtra}
              </div>
            )}
            {mode === 'location' && (
              <Button variant="secondary" size="lg" fullWidth onClick={onLocate} loading={locating}>
                {!locating && <TowIcon name="locate" size={20} />}
                {locating ? 'Finding your location…' : located ? 'Location found - update it' : 'Use my location'}
              </Button>
            )}
          </TabPanel>
          <Button variant="danger" size="lg" className={styles.search} onClick={search} disabled={locating}>
            Search
          </Button>
        </div>
        {locationError && <Notice tone="warning">{locationError}</Notice>}
      </div>

      {children}
    </section>
  )
}
