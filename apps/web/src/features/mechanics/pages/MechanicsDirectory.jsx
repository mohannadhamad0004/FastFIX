import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SERVICE_MODES, serviceModeLabel, SKILLS } from '../../../auth/signup/constants.js'
import { useAuthQuery } from '../../../auth/useAuth.js'
import { ROLES } from '../../../authorization/roles.js'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import EmptyState from '../../../components/EmptyState.jsx'
import ScrollRow from '../../../components/ScrollRow.jsx'
import { SkeletonCards } from '../../../components/Skeleton.jsx'
import { useTags } from '../../../context/TagsContext.js'
import { findCity } from '../../logistics/cities.js'
import LocationSearchHero from '../../logistics/components/LocationSearchHero.jsx'
import ResultsLayout from '../../logistics/components/ResultsLayout.jsx'
import { CitiesGrid, HowItWorks } from '../../logistics/components/TowSections.jsx'
import { haversineKm, nearestCity } from '../../logistics/geo.js'
import { useGeolocation } from '../../logistics/useGeolocation.js'
import { useCart } from '../../marketplace/CartContext.js'
import { vehicleName } from '../../marketplace/format.js'
import TileGrid from '../../marketplace/components/TileGrid.jsx'
import { compareRatings } from '../../requests/ratings.js'
import { useRatingSummaries } from '../../requests/ReviewsContext.js'
import EmergencyButton from '../../requests/emergency/components/EmergencyButton.jsx'
import MechanicCard from '../components/MechanicCard.jsx'
import MechanicFilters from '../components/MechanicFilters.jsx'
import MechanicMiniCard from '../components/MechanicMiniCard.jsx'
import { AiBanner, WhyFastFix } from '../components/MechanicSections.jsx'
import { skillImage } from '../images.js'
import { allMakes, findMechanics, knowsMake, mechanicsByCity, nearbyMechanicCities, skillCounts } from '../mechanicsSearch.js'
import { createMechanicIndex } from '../searchMechanics.js'
import { SKILL_PHOTOS } from '../skills.js'
import { skillsForProblem } from '../symptoms.js'
import styles from './MechanicsDirectory.module.css'

// TODO: replace with real API call (GET /api/mechanics)
const loadMechanics = (service) => service.getDirectory(ROLES.MECHANIC)

const NONE = []
const SORTS = [
  { value: 'match', label: 'Best match' },
  { value: 'nearest', label: 'Nearest' },
  { value: 'rating', label: 'Rating' },
]
const MODE_LABELS = { problem: 'Problem or skill', city: 'City', location: 'My location' }
const ROW_SIZE = 8
const STEPS = [
  { icon: 'phone', title: 'Describe or diagnose the problem', text: 'Type what you hear and see, or let the FastFix AI check a photo, video or sound.' },
  { icon: 'shield', title: 'Choose a verified mechanic', text: 'Compare skills, distance, ratings and the services each mechanic offers.' },
  { icon: 'chat', title: 'Chat and track the repair', text: 'Send your request, talk to the mechanic in Chats and get a report when the job is done.' },
]

// ?skill=electrical -> "Electrical" (the spelling in SKILLS); unknown skills are kept as typed.
const toSkill = (value) => SKILLS.find((skill) => skill.toLowerCase() === value.toLowerCase()) ?? value

// ?mode=on_site -> "on_site"; unknown modes are ignored.
const toMode = (value) => SERVICE_MODES.find((mode) => mode.value === value)?.value ?? ''

const byRating = (ratings) => (a, b) => compareRatings(ratings[a.id], ratings[b.id])

// /mechanics - find a mechanic: search by problem or skill (symptoms like "squeaking brakes" suggest
// the skill), city or the browser's location; skill tiles with photos; rows (top rated, near you,
// mobile, 24/7, specialists for your car); results as cards and on a map; filters for skill,
// service and car make. Search, city, skill, service, make and sort are in the URL
// (?q=brakes&city=Nablus&skill=Brakes&mode=on_site&make=Toyota&sort=rating); the AI diagnosis links
// here with ?skill=. Only approved skills and accounts are public. The customer's position is never
// stored: it stays in this page's state.
export default function MechanicsDirectory() {
  const { data, error } = useAuthQuery(loadMechanics)
  const [searchParams, setSearchParams] = useSearchParams()
  const geo = useGeolocation()
  const { vehicle } = useCart()
  const [mode, setMode] = useState('problem')

  const query = searchParams.get('q') ?? ''
  const city = findCity(searchParams.get('city') ?? '')?.name ?? ''
  const skill = toSkill(searchParams.get('skill') ?? '')
  const serviceMode = toMode(searchParams.get('mode') ?? '')
  const make = searchParams.get('make') ?? ''
  const requestedSort = searchParams.get('sort')

  const tags = useTags()
  const ratings = useRatingSummaries()
  const mechanics = data ?? NONE
  const index = useMemo(() => createMechanicIndex(mechanics, tags), [mechanics, tags])
  const symptomSkills = useMemo(() => (mode === 'problem' ? skillsForProblem(query) : NONE), [mode, query])

  // Distances are measured from the customer's position, or the middle of the searched city.
  const userPosition = mode === 'location' ? geo.position : null
  const origin = useMemo(() => {
    if (userPosition) return userPosition
    const centre = mode === 'city' && city ? findCity(city) : null
    return centre && { lat: centre.lat, lng: centre.lng }
  }, [userPosition, mode, city])
  const sort = SORTS.some((s) => s.value === requestedSort) && (origin || requestedSort !== 'nearest') ? requestedSort : origin ? 'nearest' : 'match'

  const results = useMemo(
    () => findMechanics(mechanics, { mode, query, symptomSkills, city, origin, skill, serviceMode, make, sort, index, ratings }),
    [mechanics, mode, query, symptomSkills, city, origin, skill, serviceMode, make, sort, index, ratings],
  )
  const counts = useMemo(() => skillCounts(mechanics), [mechanics])
  const makes = useMemo(() => allMakes(mechanics), [mechanics])
  const byCity = useMemo(() => mechanicsByCity(mechanics), [mechanics])
  const areaName = mode === 'location' && origin ? nearestCity(origin).city.name : city
  const nearbyCities = useMemo(() => nearbyMechanicCities(mechanics, origin, areaName), [mechanics, origin, areaName])

  // --- Rows ---
  const rows = useMemo(() => {
    const rated = [...mechanics].sort(byRating(ratings))
    const distance = (m) => (userPosition && m.base ? haversineKm(userPosition, m.base) : null)
    const twentyFourSeven = tags.find((tag) => tag.type === 'mechanic' && tag.name === '24/7')
    return {
      specialists: vehicle?.make ? rated.filter((m) => knowsMake(m, vehicle.make)) : NONE,
      topRated: rated,
      near: userPosition
        ? mechanics
            .filter((m) => m.base)
            .sort((a, b) => distance(a) - distance(b))
            .slice(0, ROW_SIZE)
        : NONE,
      mobile: rated.filter((m) => m.serviceModes.includes('on_site')),
      always: twentyFourSeven ? rated.filter((m) => m.tagIds.includes(twentyFourSeven.id)) : NONE,
      distance,
    }
  }, [mechanics, ratings, tags, vehicle, userPosition])

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
    // Nearest only makes sense with a position or a city
    if (requestedSort === 'nearest') setParam('sort', '')
  }

  async function locate() {
    const position = await geo.locate()
    changeMode(position ? 'location' : 'city')
    return position
  }

  function pickCity(name) {
    changeMode('city')
    setParam('city', name)
  }

  const scrollToResults = () => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const summary = [
    mode === 'problem' && query && (symptomSkills.length ? `for ${symptomSkills.join(' or ')}` : `matching "${query}"`),
    mode === 'city' && city && `working in ${city}`,
    mode === 'location' && origin && `near ${areaName}`,
    skill && `skilled in ${skill}`,
    serviceMode && `offering ${serviceModeLabel(serviceMode).toLowerCase()}`,
    make && `specializing in ${make}`,
  ]
    .filter(Boolean)
    .join(', ')

  const renderRow = (title, list, withDistance = false) =>
    list.length > 0 && (
      <ScrollRow title={title}>
        {list.slice(0, ROW_SIZE).map((m) => (
          <li key={m.id}>
            <MechanicMiniCard mechanic={m} rating={ratings[m.id]} distanceKm={withDistance ? rows.distance(m) : null} />
          </li>
        ))}
      </ScrollRow>
    )

  const suggestion =
    mode === 'problem' && symptomSkills.length > 0 ? (
      <p className={styles.suggestion} aria-live="polite">
        Sounds like a problem for: {symptomSkills.map((s) => (
          <Badge key={s} tone="accent">
            {s}
          </Badge>
        ))}
      </p>
    ) : null

  return (
    <div className={styles.page}>
      <LocationSearchHero
        title={
          <>
            Find a <span className={styles.accent}>trusted mechanic</span>
          </>
        }
        subtitle="Every mechanic is verified by FastFix"
        idPrefix="mechanic-by"
        textMode={{ value: 'problem', label: MODE_LABELS.problem }}
        textLabel="Describe the problem or search by skill, name or workshop"
        textPlaceholder="e.g. squeaking brakes, car won't start, AC not cold"
        textExtra={suggestion}
        mode={mode}
        onModeChange={changeMode}
        city={city}
        onCityChange={(name) => setParam('city', name)}
        query={query}
        onQueryChange={(text) => setParam('q', text.trim())}
        locating={geo.status === 'locating'}
        located={geo.status === 'ready'}
        locationError={geo.status === 'error' ? geo.error : null}
        onLocate={locate}
      >
        <EmergencyButton variant="large" />
        <AiBanner />
      </LocationSearchHero>

      {error ? (
        <EmptyState icon="⚠" title="Couldn't load mechanics" description="Please try again in a moment." />
      ) : !data ? (
        <SkeletonCards label="Loading mechanics…" />
      ) : (
        <>
          <section className={styles.section} aria-labelledby="mechanic-skills">
            <h2 id="mechanic-skills" className={styles.heading}>
              Browse by skill
            </h2>
            <TileGrid
              label="Skills"
              tiles={SKILL_PHOTOS.map(({ skill: name, slug }) => ({
                key: slug,
                label: name,
                image: skillImage(slug),
                icon: 'wrench',
                count: counts[name] ?? 0,
                countLabel: `${counts[name] ?? 0} ${counts[name] === 1 ? 'mechanic' : 'mechanics'}`,
                selected: skill === name,
                onClick: () => {
                  setParam('skill', skill === name ? '' : name)
                  if (skill !== name) scrollToResults()
                },
              }))}
            />
          </section>

          {vehicle?.make && renderRow(`Specialists for your ${vehicleName(vehicle)}`, rows.specialists)}
          {renderRow('Top rated', rows.topRated)}
          {renderRow('Near you', rows.near, true)}
          {renderRow('Mobile mechanics', rows.mobile)}
          {renderRow('Available 24/7', rows.always)}

          <ResultsLayout
            results={results}
            renderCard={({ item, distanceKm }, { highlighted }) => (
              <MechanicCard
                mechanic={item}
                rating={ratings[item.id]}
                distanceKm={distanceKm}
                highlightSkill={skill || symptomSkills[0] || ''}
                highlightMode={serviceMode}
                highlighted={highlighted}
              />
            )}
            filters={
              <MechanicFilters
                skill={skill}
                serviceMode={serviceMode}
                make={make}
                makes={makes}
                onChange={(key, value) => setParam(key, value)}
                onClear={() => {
                  setParam('skill', '')
                  setParam('mode', '')
                  setParam('make', '')
                }}
              />
            }
            sorts={SORTS}
            noun="mechanic"
            emptyTitle="No mechanics match your search"
            emptyAction={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchParams({}, { replace: true })
                  setMode('problem')
                }}
              >
                Show all mechanics
              </Button>
            }
            pin="wrench"
            getName={(item) => item.workshopName}
            origin={origin}
            isUserLocation={Boolean(userPosition)}
            summary={summary || 'all verified mechanics'}
            sort={sort}
            onSortChange={(value) => setParam('sort', value)}
            canSortNearest={Boolean(origin)}
            nearbyCities={nearbyCities}
            onPickCity={pickCity}
          />

          <HowItWorks steps={STEPS} />
          <CitiesGrid
            cities={byCity}
            title="Mechanics by city"
            path="/mechanics"
            noun="mechanic"
            nounPlural="mechanics"
            onPick={() => {
              changeMode('city')
              scrollToResults()
            }}
          />
          <WhyFastFix />
        </>
      )}
    </div>
  )
}
