// Business logic for the logistics module.

import * as model from "./logistics.model.js";

const MAX_QUERY_LENGTH = 200;

/**
 * Searches approved tow companies by name, city, service area and tags ("jenin", "heavy vehicles").
 * An empty query returns all of them.
 */
export async function searchTowCompanies(query) {
  return { results: await model.searchTowCompanies(query.slice(0, MAX_QUERY_LENGTH)) };
}
