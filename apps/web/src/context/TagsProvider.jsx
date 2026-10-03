import { useMemo, useState } from 'react'
import { seedTags } from '../features/admin/mockTags.js'
import { TagsContext } from './TagsContext.js'

const seedData = { tags: seedTags }

// TODO: replace mock implementation with real API calls (GET /api/tags)
// Holds the tag definitions in React state. `store` ({ read, write }) is for the mock admin
// service only - it writes tags like the api writes the database. Everyone else reads `tags`.
export default function TagsProvider({ children }) {
  const [data, setData] = useState(seedData)

  const [store] = useState(() => {
    let latest = seedData
    return {
      read: () => latest,
      write: (next) => {
        latest = next
        setData(next)
      },
    }
  })

  const value = useMemo(() => ({ tags: data.tags, store, version: data }), [data, store])
  return <TagsContext value={value}>{children}</TagsContext>
}
