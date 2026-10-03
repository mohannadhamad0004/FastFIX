import { createContext, useContext } from 'react'

// Tag definitions ({ id, type, name, color }) for the whole app. Public pages read them to show
// tag badges and to search by tag name; admins change them through features/admin/adminService.js.
// The provider is TagsProvider.jsx.
export const TagsContext = createContext(null)

function useTagsContext() {
  const value = useContext(TagsContext)
  if (!value) throw new Error('useTags must be used inside <TagsProvider>')
  return value
}

/** Every tag, as [{ id, type: 'part' | 'mechanic' | 'tow', name, color }]. */
export function useTags() {
  return useTagsContext().tags
}

/** The tags for a list of tag ids, in tag order. Unknown ids (deleted tags) are skipped. */
export function resolveTags(tagIds, tags) {
  if (!tagIds?.length || !tags) return []
  return tags.filter((tag) => tagIds.includes(tag.id))
}
