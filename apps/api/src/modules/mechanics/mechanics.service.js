// Business logic for the mechanics module.

import * as model from "./mechanics.model.js";

const MAX_QUERY_LENGTH = 200;

/**
 * Searches approved mechanics by name, workshop, city, approved skills and tags ("brakes nablus").
 * An empty query returns all of them.
 */
export async function searchMechanics(query) {
  return { results: await model.searchMechanics(query.slice(0, MAX_QUERY_LENGTH)) };
}
