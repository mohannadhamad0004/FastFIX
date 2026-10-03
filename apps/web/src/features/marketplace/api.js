// API calls for the marketplace feature (uses the central client in src/api).

import { apiGet } from '../../api/client.js'

/**
 * Searches the parts of every shop on the server (GET /api/marketplace/parts): part numbers in any
 * format, several words across name, category, brand, compatible vehicles and tags, typos and
 * synonyms. An empty query returns every public part. Hidden parts and parts of suspended or
 * unapproved shops are never returned.
 * @param {string} query
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('./types.js').PartSearchResponse>}
 */
export function searchParts(query, { signal } = {}) {
  return apiGet('/marketplace/parts', { params: { q: query }, signal })
}
