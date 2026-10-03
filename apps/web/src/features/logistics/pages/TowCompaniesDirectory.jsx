import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAuthQuery } from '../../../auth/useAuth.js'
import { ROLES } from '../../../authorization/roles.js'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import Notice from '../../../components/Notice.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import { useTags } from '../../../context/TagsContext.js'
import { useRatingSummaries } from '../../requests/ReviewsContext.js'
import { TOW_SORTS } from '../constants.js'
import TowCompanyCard from '../components/TowCompanyCard.jsx'
import { CitiesGrid, FeaturedTowCompanies, HowItWorks, SafetyTips } from '../components/TowSections.jsx'
import ResultsLayout from '../components/ResultsLayout.jsx'
import TowSearchHero from '../components/TowSearchHero.jsx'
import { findCity } from '../cities.js'
import { nearestCity } from '../geo.js'
import { createTowCompanyIndex } from '../searchTowCompanies.js'
import { companiesByCity, findTowCompanies, nearbyCoveredCities } from '../towSearch.js'
import { useGeolocation } from '../useGeolocation.js'
import styles from './TowCompaniesDirectory.module.css'

// TODO: replace with real API call (GET /api/tow-companies)
const loadTowCompanies = (service) => service.getDirectory(ROLES.TOW)

const NONE = []
const SORTS = ['nearest', 'rating', 'trucks']

// /tow-companies - find a tow company: search by city, company name or the browser's location,
// filter by service, sort, and see the results as cards and on a map. City, name, service and sort
// are in the URL (?city=Nablus&service=local&sort=rating). The customer's position is never
// stored: it stays in this page's state, and only goes into a tow request the customer confirms.
export default function TowCompaniesDirectory() {
  const { data, error } = useAuthQuery(loadTowCompanies)
  const [searchParams, setSearchParams] = useSearchParams()
  const geo = useGeolocation()
  const [mode, setMode] = useState('city')
  const [emergency, setEmergency] = useState(false)

  const city = findCity(searchParams.get('city') ?? '')?.name ?? ''
  const query = searchParams.get('q') ?? ''
  const service = searchParams.get('service') ?? ''
  const tags = useTags()
  const ratings = useRatingSummaries()
  const companies = data ?? NONE
  const index = useMemo(() => createTowCompanyIndex(companies, tags), [companies, tags])

  // Where distances are measured from: the customer's position, or the middle of the searched city.
  const userPosition = mode !== 'city' ? geo.position : null
  const origin = useMemo(() => {
    if (userPosition) return userPosition
    const centre = mode === 'city' && city ? findCity(city) : null
    return centre && { lat: centre.lat, lng: centre.lng }
  }, [userPosition, mode, city])
  const requestedSort = searchParams.get('sort')
  // Nearest when there is a position, otherwise best rated (or best name match when searching by name).
  const sort = SORTS.includes(requestedSort) && (origin || requestedSort !== 'nearest')
    ? requestedSort
    : origin ? 'nearest' : mode === 'name' && query ? 'search' : 'rating'

  const results = useMemo(
    () => findTowCompanies(companies, { mode, city, query, origin, service, emergency, sort, index, ratings }),
    [companies, mode, city, query, origin, service, emergency, sort, index, ratings],
  )
  const byCity = useMemo(() => companiesByCity(companies), [companies])
  const areaName = mode === 'location' && origin ? nearestCity(origin).city.name : city
  const nearbyCities = useMemo(
    () => nearbyCoveredCities(companies, origin, areaName),
    [companies, origin, areaName],
  )

  function setParam(key, value) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  function changeMode(next) {
    setMode(next)
    setEmergency(false)
  }

  // "Use my location": on failure the hero shows why and we go back to searching by city.
  async function locate(isEmergency = false) {
    const position = await geo.locate()
    changeMode(position ? 'location' : 'city')
    if (position) {
      setEmergency(isEmergency)
      setParam('sort', '')
    }
    return position
  }

  function pickCity(name) {
    changeMode('city')
    setParam('city', name)
  }

  const summary = emergency
    ? 'with a truck available now, nearest first'
    : mode === 'location' && origin
      ? `near ${areaName}`
      : mode === 'name' && query
        ? `matching "${query}"`
        : city
          ? `covering ${city}`
          : 'all verified companies'

  return (
    <div className={styles.page}>
      <TowSearchHero
        mode={mode}
        onModeChange={changeMode}
        city={city}
        onCityChange={(name) => setParam('city', name)}
        query={query}
        onQueryChange={(text) => setParam('q', text.trim())}
        service={service}
        onServiceChange={(value) => setParam('service', value)}
        locating={geo.status === 'locating'}
        located={geo.status === 'ready'}
        locationError={geo.status === 'error' ? geo.error : null}
        onLocate={() => locate()}
        onEmergency={() => locate(true)}
      />

      {error ? (
        <EmptyState icon="⚠" title="Couldn't load tow companies" description="Please try again in a moment." />
      ) : !data ? (
        <SkeletonCards label="Loading tow companies…" />
      ) : (
        <>
          <ResultsLayout
            results={results}
            renderCard={({ item, distanceKm }, { highlighted }) => (
              <TowCompanyCard
                company={item}
                rating={ratings[item.id]}
                distanceKm={distanceKm}
                highlighted={highlighted}
                pickupPosition={geo.position}
              />
            )}
            sorts={TOW_SORTS}
            noun="company"
            emptyTitle="No tow companies cover this area yet"
            pin="truck"
            origin={origin}
            isUserLocation={Boolean(userPosition)}
            summary={summary}
            sort={sort}
            onSortChange={(value) => setParam('sort', value)}
            canSortNearest={Boolean(origin)}
            nearbyCities={nearbyCities}
            onPickCity={pickCity}
            note={
              emergency && (
                <Notice tone="info">
                  Showing only companies with a truck free right now.{' '}
                  <Button variant="ghost" size="sm" onClick={() => setEmergency(false)}>
                    Show all nearby companies
                  </Button>
                </Notice>
              )
            }
          />
          <HowItWorks />
          <CitiesGrid
            cities={byCity}
            onPick={() => {
              changeMode('city')
              document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
          <FeaturedTowCompanies companies={companies} ratings={ratings} />
          <SafetyTips />
        </>
      )}
    </div>
  )
}
