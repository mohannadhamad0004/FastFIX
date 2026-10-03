import { Link } from 'react-router'
import Avatar from '../../../components/Avatar.jsx'
import Badge from '../../../components/Badge.jsx'
import Button from '../../../components/Button.jsx'
import Card from '../../../components/Card.jsx'
import FileImage from '../../../components/FileImage.jsx'
import TagBadges from '../../../components/TagBadges.jsx'
import VerifiedBadge from '../../../components/VerifiedBadge.jsx'
import { resolveTags, useTags } from '../../../context/TagsContext.js'
import { formatDistance } from '../../logistics/geo.js'
import { RequestServiceButton } from '../../requests/components/RequestButtons.jsx'
import { RatingSummary } from '../../requests/components/Stars.jsx'
import { workshopImage } from '../images.js'
import ServiceModeBadges from './ServiceModeBadges.jsx'
import styles from './MechanicCard.module.css'

const TOP_SKILLS = 3

/** The workshop's cover: a real photo when there is one, else the first uploaded workshop photo, else a plain band. */
export function WorkshopCover({ mechanic, className }) {
  const url = workshopImage(mechanic.id)
  const first = mechanic.workshopPhotos?.[0]
  if (url) {
    return <img className={className} src={url} alt="" width={800} height={450} loading="lazy" decoding="async" />
  }
  return first ? (
    <FileImage file={first} alt="" className={className} loading="lazy" />
  ) : (
    <span className={`${className} ${styles.noCover}`} />
  )
}

/**
 * One mechanic in the results: workshop cover photo with the avatar over its bottom edge, workshop
 * and mechanic name, city and distance, rating, Verified, tags, service modes, the top 3 skills,
 * and "View profile" / "Request service". Every card has the same height.
 * @param {Object} props
 * @param {import('../types.js').PublicMechanic} props.mechanic
 * @param {{ average: number, count: number } | null} [props.rating]   from useRatingSummaries()
 * @param {number | null} [props.distanceKm]
 * @param {string} [props.highlightSkill]   the skill the results are filtered by
 * @param {string} [props.highlightMode]    the service mode the results are filtered by
 * @param {boolean} [props.highlighted]     chosen on the map
 * @param {React.Ref<HTMLElement>} [props.ref]  for scrolling the card into view
 */
export default function MechanicCard({
  mechanic,
  rating = null,
  distanceKm = null,
  highlightSkill = '',
  highlightMode = '',
  highlighted = false,
  ref,
}) {
  const tags = resolveTags(mechanic.tagIds, useTags())
  // The filtered skill first, then the rest in the order the mechanic listed them
  const skills = [...mechanic.skills].sort((a, b) => Number(b.skill === highlightSkill) - Number(a.skill === highlightSkill))
  const shown = skills.slice(0, TOP_SKILLS)

  return (
    <Card
      as="article"
      ref={ref}
      padding="none"
      className={`${styles.card} ${highlighted ? styles.highlighted : ''}`}
      aria-labelledby={`mechanic-${mechanic.id}`}
    >
      <div className={styles.coverWrap}>
        <WorkshopCover mechanic={mechanic} className={styles.cover} />
        <span className={styles.avatar}>
          <Avatar file={mechanic.profilePhoto} name={mechanic.name} size="lg" />
        </span>
        {distanceKm !== null && <span className={styles.distance}>{formatDistance(distanceKm)}</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.titles}>
          <h3 id={`mechanic-${mechanic.id}`} className={styles.workshop}>
            <Link to={`/mechanics/${mechanic.id}`} className={styles.link}>
              {mechanic.workshopName}
            </Link>
          </h3>
          <p className={styles.muted}>
            {mechanic.name} · {mechanic.city}
          </p>
          <RatingSummary summary={rating} />
        </div>

        <div className={styles.badges}>
          <VerifiedBadge />
          <TagBadges tags={tags} />
        </div>
        <ServiceModeBadges modes={mechanic.serviceModes} highlight={highlightMode} />
        <ul className={styles.skills} aria-label="Top skills">
          {shown.map((skill) => (
            <li key={skill.id}>
              <Badge tone={skill.skill === highlightSkill ? 'accent' : 'primary'}>{skill.skill}</Badge>
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Button to={`/mechanics/${mechanic.id}`} variant="secondary">
            View profile
          </Button>
          <RequestServiceButton mechanic={mechanic} />
        </div>
      </div>
    </Card>
  )
}
