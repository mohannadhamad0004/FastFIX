// Database queries for the mechanics module.

import { pool } from "../../db/connection.js";
import { search } from "../../search/searchEngine.js";

// public_mechanic_search only has approved, non-suspended mechanics with at least one approved
// skill, lists approved skills only, and has no contact details.
/** @type {import('../../search/searchEngine.js').SearchConfig} */
const MECHANIC_SEARCH = { view: "public_mechanic_search", orderBy: "d.name, d.id", limit: 200 };

export async function searchMechanics(query, db = pool) {
  const { hits } = await search(db, MECHANIC_SEARCH, query);
  return hits.map(({ row, highlight }) => ({
    mechanic: {
      id: row.id,
      name: row.name,
      city: row.city,
      workshopName: row.workshop_name,
      address: row.address,
      skills: row.skills,
      tagIds: row.tag_ids,
      verified: true,
    },
    highlight,
  }));
}
