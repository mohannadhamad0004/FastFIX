import { Link } from 'react-router'
import Avatar from '../../../components/Avatar.jsx'
import Button from '../../../components/Button.jsx'
import Card from '../../../components/Card.jsx'
import TagBadges from '../../../components/TagBadges.jsx'
import VerifiedBadge from '../../../components/VerifiedBadge.jsx'
import { resolveTags, useTags } from '../../../context/TagsContext.js'
import { RequestTowButton } from '../../requests/components/RequestButtons.jsx'
import { RatingSummary } from '../../requests/components/Stars.jsx'
import { TOW_SERVICES } from '../constants.js'
import { formatDistance } from '../geo.js'
import TowIcon from './TowIcon.jsx'
import styles from './TowCompanyCard.module.css'

/**
 * One tow company in the results: logo, name, rating and reviews, Verified, tags (24/7...),
 * services, cities covered, trucks available now, distance, and "View profile" / "Request tow".
 * @param {Object} props
 * @param {import('../types.js').PublicTowCompany} props.company
 * @param {{ average: number, count: number } | null} [props.rating]   from useRatingSummaries()
 * @param {number | null} [props.distanceKm]
 * @param {boolean} [props.highlighted]   chosen on the map
 * @param {{ lat: number, lng: number } | null} [props.pickupPosition]  pre-fills "Request tow"
 * @param {React.Ref<HTMLElement>} [props.ref]  for scrolling the card into view
 */
export default function TowCompanyCard({ company, rating = null, distanceKm = null, highlighted = false, pickupPosition = null, ref }) {
  const tags = resolveTags(company.tagIds, useTags())
  const services = TOW_SERVICES.filter((service) => company.towServices?.includes(service.value))
  const available = company.availableTrucks ?? company.trucks.length

  return (
    <Card as="article" ref={ref} className={`${styles.card} ${highlighted ? styles.highlighted : ''}`} aria-labelledby={`tow-${company.id}`}>
      <div className={styles.header}>
        <Avatar file={company.profilePhoto} name={company.name} />
        <div className={styles.titleBlock}>
          <h3 id={`tow-${company.id}`} className={styles.name}>
            <Link to={`/tow-companies/${company.id}`}>{company.name}</Link>
          </h3>
          <RatingSummary summary={rating} />
        </div>
        {distanceKm !== null && (
          <p className={styles.distance}>
            <TowIcon name="pin" size={16} />
            {formatDistance(distanceKm)}
          </p>
        )}
      </div>

      <div className={styles.badges}>
        <VerifiedBadge />
        <TagBadges tags={tags} />
      </div>

      {services.length > 0 && (
        <ul className={styles.services} aria-label="Services">
          {services.map((service) => (
            <li key={service.value}>
              <TowIcon name={service.icon} size={16} />
              {service.label}
            </li>
          ))}
        </ul>
      )}

      <dl className={styles.facts}>
        <div>
          <dt>Covers</dt>
          <dd>{company.serviceArea.join(', ')}</dd>
        </div>
        <div>
          <dt>Trucks available now</dt>
          <dd className={available === 0 ? styles.none : styles.available}>
            {available === 0 ? 'None right now' : `${available} of ${company.trucks.length}`}
          </dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button to={`/tow-companies/${company.id}`} variant="secondary">
          View profile
        </Button>
        <RequestTowButton company={company} pickupPosition={pickupPosition} />
      </div>
    </Card>
  )
}
