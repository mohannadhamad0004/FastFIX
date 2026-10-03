import { Link } from 'react-router'
import { useAuthQuery } from '../auth/useAuth.js'
import { ROLES } from '../authorization/roles.js'
import Badge from '../components/Badge.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import { SkeletonCards } from '../components/Skeleton.jsx'
import { formatPrice } from '../features/marketplace/format.js'
import { useMarketplaceQuery } from '../features/marketplace/MarketplaceContext.js'
import MechanicCard from '../features/mechanics/components/MechanicCard.jsx'
import EmergencyButton from '../features/requests/emergency/components/EmergencyButton.jsx'
import { useRatingSummaries } from '../features/requests/ReviewsContext.js'
import styles from './Home.module.css'

const steps = [
  {
    title: 'Upload',
    text: 'Take a photo of a warning light or leak, film the smoke, or record the engine noise right in your browser.',
    icon: '📷',
  },
  {
    title: 'Get your AI report',
    text: 'See what the AI noticed, the possible causes with how strong the evidence is, and whether it is safe to drive.',
    icon: '✨',
  },
  {
    title: 'Connect with a verified mechanic',
    text: 'Find a mechanic with the right skill. They confirm or correct the diagnosis and fix your car.',
    icon: '🔧',
  },
]

const destinations = [
  {
    to: '/diagnose',
    title: 'Diagnose a problem',
    text: 'Upload a photo, video or engine sound and get a preliminary AI report.',
    icon: '✨',
    cta: 'Start a diagnosis',
  },
  {
    to: '/mechanics',
    title: 'Find a mechanic',
    text: 'Every mechanic is checked by FastFix. Filter by skill and city, and send a request.',
    icon: '🧰',
    cta: 'Find a mechanic',
  },
  {
    to: '/marketplace',
    title: 'Buy car parts',
    text: 'Search parts from every shop by part number, name or car, with typo-tolerant search.',
    icon: '🛒',
    cta: 'Search parts',
  },
  {
    to: '/tow-companies',
    title: 'Get a tow',
    text: 'Stuck on the road? Find a verified tow company that covers your city.',
    icon: '🚚',
    cta: 'Find a tow truck',
  },
]

const trustPoints = [
  { title: 'Documents checked', text: 'Business licenses and certificates are reviewed by our team before an account goes public.' },
  { title: 'Skills approved one by one', text: 'A mechanic only shows the skills an admin has approved.' },
  { title: 'Real reviews', text: 'Only customers of a completed request can review, once per request.' },
]
// Featured picks: tagged items first ("Top Rated" mechanics, "Best Seller" / "On Offer" parts).
const TOP_RATED = 't-4'
const PROMOTED_PART_TAGS = ['t-2', 't-3']
const byTag = (hasTag) => (a, b) => Number(hasTag(b)) - Number(hasTag(a))

// TODO: replace with real API calls (GET /api/mechanics, GET /api/marketplace/parts)
const loadMechanics = (service) => service.getDirectory(ROLES.MECHANIC)
const loadParts = (service) => service.getParts()

// "/" - hero with the diagnosis preview, what do you need, how it works, featured providers and parts,
// the trust section and the emergency callout. The diagnosis itself lives at /diagnose.
export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroText}>
          <Badge tone="accent" size="md">
            AI diagnosis · Free to try
          </Badge>
          <h1 id="home-title" className={styles.heroTitle}>
            Understand what&apos;s wrong with your <span className={styles.heroAccent}>car</span>, then get it fixed.
          </h1>
          <p className={styles.heroSubtitle}>
            Upload a photo, a video or the sound of your engine. FastFix&apos;s AI gives you a preliminary diagnosis in
            seconds, and a verified mechanic confirms it.
          </p>
          <div className={styles.heroActions}>
            <Button to="/diagnose" size="lg">
              Diagnose my car
            </Button>
            <Button to="/mechanics" variant="secondary" size="lg">
              Find a mechanic
            </Button>
          </div>
          <ul className={styles.trust} aria-label="Why FastFix">
            <li>✓ Verified providers</li>
            <li>✓ AI-assisted triage</li>
            <li>✓ Towing assistance</li>
          </ul>
        </div>
        <ReportPreview />
      </section>

      <section className={styles.section} aria-labelledby="explore-title">
        <div className={styles.sectionHeader}>
          <h2 id="explore-title" className={styles.sectionTitle}>
            What do you need right now?
          </h2>
        </div>
        <ul className={styles.destinations}>
          {destinations.map((item) => (
            <Card as="li" key={item.to} interactive padding="lg" className={styles.destination}>
              <span className={styles.destinationIcon} aria-hidden="true">
                {item.icon}
              </span>
              <h3 className={styles.destinationTitle}>
                <Link to={item.to} className={`${styles.destinationLink} ${Card.cover}`}>
                  {item.title}
                </Link>
              </h3>
              <p className={styles.destinationText}>{item.text}</p>
              <span className={styles.destinationCta} aria-hidden="true">
                {item.cta} →
              </span>
            </Card>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="how-title">
        <div className={styles.sectionHeader}>
          <h2 id="how-title" className={styles.sectionTitle}>
            How FastFix works
          </h2>
          <p className={styles.sectionText}>From “what's that noise?” to a mechanic who knows what to fix.</p>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepMarker} aria-hidden="true">
                {index + 1}
              </span>
              <span className={styles.stepIcon} aria-hidden="true">
                {step.icon}
              </span>
              <h3 className={styles.stepTitle}>
                <span className={styles.srOnly}>Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Featured />

      <section className={styles.trustSection} aria-labelledby="trust-title">
        <div className={styles.sectionHeader}>
          <h2 id="trust-title" className={styles.sectionTitle}>
            Verified before they&apos;re visible
          </h2>
          <p className={styles.sectionText}>Nobody appears on FastFix until an admin has checked them.</p>
        </div>
        <ul className={styles.trustGrid}>
          {trustPoints.map((point) => (
            <li key={point.title}>
              <h3 className={styles.trustTitle}>
                <span aria-hidden="true">✓ </span>
                {point.title}
              </h3>
              <p className={styles.stepText}>{point.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.emergency} aria-labelledby="emergency-title">
        <h2 id="emergency-title" className={styles.sectionTitle}>
          Broken down right now?
        </h2>
        <p className={styles.sectionText}>
          Skip the search: send your location and the nearest tow truck or on-site mechanic is alerted.
        </p>
        <div className={styles.emergencyAction}>
          <EmergencyButton variant="large" />
          <Button to="/tow-companies" variant="secondary">
            Browse tow companies
          </Button>
        </div>
      </section>
    </div>
  )
}

// A product preview made from UI (not a screenshot): what a FastFix report looks like.
function ReportPreview() {
  return (
    <figure className={styles.preview} aria-label="Example of an AI diagnosis report">
      <figcaption className={styles.previewCaption}>Example report</figcaption>
      <p className={styles.previewVehicle}>Hyundai Accent 2016</p>
      <p className={styles.previewUrgency}>
        <span aria-hidden="true">! </span>Inspect soon
      </p>
      <p className={styles.previewLabel}>Most likely issue</p>
      <p className={styles.previewIssue}>Worn serpentine belt</p>
      <p className={styles.previewEvidence}>
        <span className={styles.previewMeter} aria-hidden="true">
          <span /> <span /> <span className={styles.previewOff} />
        </span>
        Evidence: Moderate
      </p>
      <p className={styles.previewLabel}>Suggested specialty</p>
      <p className={styles.previewChip}>🔧 Engine mechanic</p>
    </figure>
  )
}
// A few mechanics and parts from the (mock) data, tagged ones first.
function Featured() {
  const mechanics = useAuthQuery(loadMechanics)
  const ratings = useRatingSummaries()
  const parts = useMarketplaceQuery(loadParts)

  const featuredMechanics = (mechanics.data ?? [])
    .toSorted(byTag((m) => m.tagIds.includes(TOP_RATED)))
    .slice(0, 3)
  const featuredParts = (parts.data ?? [])
    .toSorted(byTag((p) => p.tagIds?.some((id) => PROMOTED_PART_TAGS.includes(id))))
    .slice(0, 4)

  return (
    <section className={styles.section} aria-labelledby="featured-title">
      <div className={styles.sectionHeader}>
        <h2 id="featured-title" className={styles.sectionTitle}>
          Featured on FastFix
        </h2>
      </div>

      <div className={styles.featuredGroup}>
        <div className={styles.featuredHeader}>
          <h3 className={styles.featuredTitle}>Top mechanics</h3>
          <Link to="/mechanics" className={styles.seeAll}>
            See all mechanics →
          </Link>
        </div>
        {!mechanics.data ? (
          <SkeletonCards count={3} label="Loading mechanics…" />
        ) : (
          <ul className={styles.strip}>
            {featuredMechanics.map((mechanic) => (
              <li key={mechanic.id}>
                <MechanicCard mechanic={mechanic} rating={ratings[mechanic.id]} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.featuredGroup}>
        <div className={styles.featuredHeader}>
          <h3 className={styles.featuredTitle}>Popular parts</h3>
          <Link to="/marketplace" className={styles.seeAll}>
            See all parts →
          </Link>
        </div>
        {!parts.data ? (
          <SkeletonCards count={4} label="Loading parts…" />
        ) : (
          <ul className={`${styles.strip} ${styles.partsStrip}`}>
            {featuredParts.map((part) => (
              <Card as="li" key={part.id} interactive className={styles.partTile}>
                <span className={styles.partCategory}>{part.category}</span>
                <h4 className={styles.partName}>
                  <Link
                    to={`/marketplace/search?q=${encodeURIComponent(part.oemNumber || part.name)}`}
                    className={`${styles.partLink} ${Card.cover}`}
                  >
                    {part.name}
                  </Link>
                </h4>
                <p className={styles.partMeta}>
                  {part.brand} · fits {part.fitments[0]?.make} {part.fitments[0]?.model}
                  {part.fitments.length > 1 && ` +${part.fitments.length - 1}`}
                </p>
                <p className={styles.partPrice}>{formatPrice(part.priceIls)}</p>
              </Card>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
