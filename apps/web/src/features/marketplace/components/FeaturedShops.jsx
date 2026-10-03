import { Link } from 'react-router'
import Avatar from '../../../components/Avatar.jsx'
import Card from '../../../components/Card.jsx'
import { RatingSummary } from '../../requests/components/Stars.jsx'
import { compareRatings } from '../../requests/ratings.js'
import ScrollRow from '../../../components/ScrollRow.jsx'
import styles from './FeaturedShops.module.css'

// "Featured shops": logo, name, city and rating, best rated first. Each links to the shop's page.
export default function FeaturedShops({ shops, ratings }) {
  if (shops.length === 0) return null
  const sorted = [...shops].sort((a, b) => compareRatings(ratings[a.id], ratings[b.id]))
  return (
    <ScrollRow title="Featured shops">
      {sorted.map((shop) => (
        <li key={shop.id}>
          <Card as="article" interactive className={styles.shop}>
            <Avatar file={shop.logo} name={shop.name} size="lg" />
            <h3 className={styles.name}>
              <Link to={`/shops/${shop.id}`} className={`${styles.link} ${Card.cover}`}>
                {shop.name}
              </Link>
            </h3>
            <p className={styles.city}>{shop.city}</p>
            <RatingSummary summary={ratings[shop.id]} compact />
          </Card>
        </li>
      ))}
    </ScrollRow>
  )
}
