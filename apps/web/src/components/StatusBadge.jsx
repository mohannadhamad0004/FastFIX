import Badge from './Badge.jsx'

// Small colored pill for statuses and urgency levels. A shortcut for <Badge tone={tone}>{label}</Badge>.
// tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export default function StatusBadge({ label, tone = 'neutral' }) {
  return <Badge tone={tone}>{label}</Badge>
}
