import { Link } from 'react-router'
import Avatar from '../../../components/Avatar.jsx'
import Card from '../../../components/Card.jsx'
import ScrollRow from '../../../components/ScrollRow.jsx'
import { RatingSummary } from '../../requests/components/Stars.jsx'
import { compareRatings } from '../../requests/ratings.js'
import TowIcon from './TowIcon.jsx'
import styles from './TowSections.module.css'

// The sections under the results on /tow-companies.

const STEPS = [
  { icon: 'locate', title: 'Share your location', text: 'Use your location or pick your city. It is only used to find companies near you.' },
  { icon: 'shield', title: 'Choose a verified company', text: 'Every company is checked by FastFix. Compare distance, rating and trucks available.' },
  { icon: 'chat', title: 'Track the request in your chats', text: 'Send the request and follow it with the company in Chats.' },
]

const TIPS = [
  { icon: 'hazard', text: 'Turn on your hazard lights.' },
  { icon: 'road', text: 'Stay off the road: wait behind the barrier or well away from traffic.' },
  { icon: 'phone', text: 'Keep your phone charged, and keep it with you.' },
]

/** @param {{ steps?: { icon: string, title: string, text: string }[] }} props */
export function HowItWorks({ steps = STEPS }) {
  return (
    <section className={styles.section} aria-labelledby="tow-how">
      <h2 id="tow-how" className={styles.heading}>
        How it works
      </h2>
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepIcon}>
              <TowIcon name={step.icon} size={24} />
            </span>
            <h3 className={styles.stepTitle}>
              <span className={styles.stepNumber}>{index + 1}.</span> {step.title}
            </h3>
            <p className={styles.muted}>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * "... by city": each city with its number of companies (or mechanics), linking to `path?city=`.
 * @param {{ cities: { city: { name: string }, count: number }[], onPick: (city: string) => void, title?: string, path?: string, noun?: string, nounPlural?: string }} props
 */
export function CitiesGrid({ cities, onPick, title = 'Tow companies by city', path = '/tow-companies', noun = 'company', nounPlural = 'companies' }) {
  if (cities.length === 0) return null
  return (
    <section className={styles.section} aria-labelledby="tow-cities">
      <h2 id="tow-cities" className={styles.heading}>
        {title}
      </h2>
      <ul className={styles.cities}>
        {cities.map(({ city, count }) => (
          <li key={city.name}>
            <Link
              to={`${path}?city=${encodeURIComponent(city.name)}`}
              className={styles.city}
              onClick={() => onPick(city.name)}
            >
              <TowIcon name="city" size={20} />
              <span className={styles.cityName}>{city.name}</span>
              <span className={styles.count}>
                {count} {count === 1 ? noun : nounPlural}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** "Featured tow companies": the best rated, in a row with arrows. */
export function FeaturedTowCompanies({ companies, ratings }) {
  const best = [...companies].sort((a, b) => compareRatings(ratings[a.id], ratings[b.id])).slice(0, 8)
  if (best.length === 0) return null
  return (
    <ScrollRow title="Featured tow companies">
      {best.map((company) => (
        <li key={company.id}>
          <Card as="article" interactive className={styles.featured}>
            <Avatar file={company.profilePhoto} name={company.name} size="lg" />
            <h3 className={styles.featuredName}>
              <Link to={`/tow-companies/${company.id}`} className={`${styles.featuredLink} ${Card.cover}`}>
                {company.name}
              </Link>
            </h3>
            <p className={styles.muted}>{company.city}</p>
            <RatingSummary summary={ratings[company.id]} compact />
          </Card>
        </li>
      ))}
    </ScrollRow>
  )
}

export function SafetyTips() {
  return (
    <aside className={styles.tips} aria-labelledby="tow-tips">
      <h2 id="tow-tips" className={styles.heading}>
        While you wait
      </h2>
      <ul className={styles.tipList}>
        {TIPS.map((tip) => (
          <li key={tip.icon}>
            <TowIcon name={tip.icon} size={22} />
            {tip.text}
          </li>
        ))}
      </ul>
    </aside>
  )
}
