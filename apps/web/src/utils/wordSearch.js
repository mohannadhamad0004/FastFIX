import Fuse from 'fuse.js'

// Typo-tolerant word search for directories (mechanics, tow companies) and admin lists, in the
// browser. The marketplace searches on the server instead (apps/api/src/search), and the
// directories can move there too: GET /api/mechanics?q= and GET /api/tow-companies?q=.
//
// Every distinct word in the searchable fields goes into a word list. Each query word is
// fuzzy-matched against that list with Fuse ("nablis" -> "nablus", "breaks" -> "brakes"), and an
// item is a result when every query word matched one of its words.

const STOP_WORDS = new Set(['for', 'the', 'and', 'with', 'of', 'to', 'in', 'on', 'an', 'my', 'at'])

// Fuse scores run from 0 (exact) to 1. Fuse never returns exactly 0, so this counts as exact.
const EXACT = 0.001

function tokenize(text) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token))
}

// Allowed typos grow with word length: up to 3 letters must match exactly, 4-5 letters allow
// one typo, longer words two. With ignoreLocation, Fuse's score is typos / word length.
function maxScore(token) {
  const typos = token.length <= 3 ? 0 : token.length <= 5 ? 1 : 2
  return typos / token.length + EXACT
}

/**
 * Build once per list; pass the result to searchWords.
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string[]} getTexts  the searchable text of one item
 */
export function createWordIndex(items, getTexts) {
  const termItems = new Map() // word -> Set of item positions
  items.forEach((item, position) => {
    for (const text of getTexts(item)) {
      for (const term of tokenize(text)) {
        if (!termItems.has(term)) termItems.set(term, new Set())
        termItems.get(term).add(position)
      }
    }
  })
  const fuse = new Fuse([...termItems.keys()], {
    includeScore: true,
    ignoreLocation: true,
    ignoreFieldNorm: true,
    threshold: 0.4,
  })
  return { items, termItems, fuse }
}

// Words from the word list close enough to `token`. Short tokens only match by prefix, so
// typing "nab" already finds "nablus".
function findTerms(index, token) {
  return index.fuse
    .search(token)
    .filter(({ item, score }) => score <= maxScore(token) && (token.length > 3 || item.startsWith(token)))
}

/**
 * Items matching every query word, fewest typos first (original order breaks ties).
 * An empty query returns every item.
 * @template T
 * @returns {T[]}
 */
export function searchWords(index, query) {
  const tokens = tokenize(query)
  if (tokens.length === 0) return index.items

  const perToken = tokens.map((token) => {
    const best = new Map() // item position -> lowest score
    for (const { item: term, score } of findTerms(index, token)) {
      for (const position of index.termItems.get(term)) {
        best.set(position, Math.min(best.get(position) ?? 1, score))
      }
    }
    return best
  })

  const ranked = []
  index.items.forEach((item, position) => {
    const scores = perToken.map((best) => best.get(position))
    if (scores.some((score) => score === undefined)) return
    ranked.push({ item, position, typos: scores.reduce((sum, score) => sum + score, 0) })
  })
  ranked.sort((a, b) => a.typos - b.typos || a.position - b.position)
  return ranked.map(({ item }) => item)
}
