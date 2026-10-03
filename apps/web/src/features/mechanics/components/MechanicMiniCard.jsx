import { Link } from 'react-router'
import Card from '../../../components/Card.jsx'
import { formatDistance } from '../../logistics/geo.js'
import { RatingSummary } from '../../requests/components/Stars.jsx'
import { WorkshopCover } from './MechanicCard.jsx'
import styles from './MechanicMiniCard.module.css'

/**
 * A small mechanic card for the rows ("Top rated", "Near you", ...): workshop photo, name, city (or
 * distance), rating and top skills. The whole card links to the profile.
 */
export default function MechanicMiniCard({ mechanic, rating = null, distanceKm = null }) {
  return (
    <Card as="article" interactive padding="none" className={styles.card}>
      <WorkshopCover mechanic={mechanic} className={styles.cover} />
      <div className={styles.body}>
        <h3 className={styles.name}>
          <Link to={`/mechanics/${mechanic.id}`} className={`${styles.link} ${Card.cover}`}>
            {mechanic.workshopName}
          </Link>
        </h3>
        <p className={styles.muted}>{distanceKm !== null ? `${mechanic.city} · ${formatDistance(distanceKm)}` : mechanic.city}</p>
        <RatingSummary summary={rating} compact />
        <p className={styles.skill}>
          {mechanic.skills
            .slice(0, 2)
            .map((s) => s.skill)
            .join(' · ')}
        </p>
      </div>
    </Card>
  )
}
