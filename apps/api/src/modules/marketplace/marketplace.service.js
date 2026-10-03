// Business logic for the marketplace module.

import * as model from "./marketplace.model.js";

const MAX_QUERY_LENGTH = 200;

/**
 * Searches the public parts of every shop. An empty query returns every public part.
 * @param {string} query
 * @returns {Promise<{ results: object[], suggestion: { label: string, query: string } | null }>}
 */
export async function searchParts(query) {
  const text = query.slice(0, MAX_QUERY_LENGTH);
  const { results, words, goodResult } = await model.searchParts(text);
  return { results, suggestion: goodResult ? null : await suggestVehicle(text, words) };
}

// "Did you mean: Hyundai?" for the first word that matched nothing, or only a make or model by
// fixing a typo. A typo of another word ("stering" -> "steering") gets no suggestion.
async function suggestVehicle(query, words) {
  for (const word of words) {
    if (word.terms.length !== 1) continue;
    const [term] = word.terms;
    const unmatched = term.words.length === 0 && term.phrases.length === 0;
    if (!unmatched && !(term.typo && term.vehicle)) continue;

    const label = await model.findClosestVehicleName(term.token);
    if (label && label.toLowerCase() !== term.token) return { label, query: query.replace(word.text, label) };
  }
  return null;
}
