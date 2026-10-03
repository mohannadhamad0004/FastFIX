import { tagColor } from '../utils/tagColors.js'
import styles from './TagBadges.module.css'

// Colored tag badges ("Best Seller", "24/7"). `tags` are resolved tags: [{ id, name, color }].
export default function TagBadges({ tags, className = '' }) {
  if (!tags?.length) return null
  return (
    <ul className={`${styles.tags} ${className}`.trim()} aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag.id} className={styles.tag} style={{ backgroundColor: tagColor(tag.color) }}>
          {tag.name}
        </li>
      ))}
    </ul>
  )
}
