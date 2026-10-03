import PartMiniCard from './PartMiniCard.jsx'
import ScrollRow from '../../../components/ScrollRow.jsx'

const MAX_IN_ROW = 12

// A product row: title, "View all", arrows, and up to 12 parts. Renders nothing without parts.
export default function PartRow({ title, parts, shopsById, tags, viewAllTo }) {
  if (parts.length === 0) return null
  return (
    <ScrollRow title={title} viewAllTo={viewAllTo}>
      {parts.slice(0, MAX_IN_ROW).map((part) => (
        <li key={part.id}>
          <PartMiniCard part={part} shop={shopsById[part.shopId]} tags={tags} />
        </li>
      ))}
    </ScrollRow>
  )
}
