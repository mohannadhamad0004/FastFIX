import { serviceModeLabel } from '../../auth/signup/constants.js'
import { resolveTags } from '../../context/TagsContext.js'
import { createWordIndex, searchWords } from '../../utils/wordSearch.js'

// Typo-tolerant search over name, workshop name, city, on-site cities, skills, service modes and
// tag names ("brakes nablus", "kareem", "hybrd bethlehem", "online").

/** Build once per list of PublicMechanic. Tags are all tag definitions (useTags()). */
export const createMechanicIndex = (mechanics, tags) =>
  createWordIndex(mechanics, (m) => [
    m.name,
    m.workshopName,
    m.city,
    ...m.onSiteCities,
    ...m.skills.map((s) => s.skill),
    ...m.serviceModes.map(serviceModeLabel),
    ...resolveTags(m.tagIds, tags).map((t) => t.name),
  ])

export const searchMechanics = (index, query) => searchWords(index, query)
