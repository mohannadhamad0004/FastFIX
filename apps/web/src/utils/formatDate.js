// "2026-09-30T10:15:00.000Z" -> "30 Sept 2026"
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
