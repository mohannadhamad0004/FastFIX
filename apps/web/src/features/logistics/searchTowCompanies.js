import { resolveTags } from '../../context/TagsContext.js'
import { createWordIndex, searchWords } from '../../utils/wordSearch.js'

// Typo-tolerant search over company name, city, the cities they cover and tag names
// ("jenin", "nablus rescue", "heavy vehicles").

/** Build once per list of PublicTowCompany. Tags are all tag definitions (useTags()). */
export const createTowCompanyIndex = (companies, tags) =>
  createWordIndex(companies, (c) => [c.name, c.city, ...c.serviceArea, ...resolveTags(c.tagIds, tags).map((t) => t.name)])

export const searchTowCompanies = (index, query) => searchWords(index, query)
