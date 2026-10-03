// Database queries for the logistics module.

import { pool } from "../../db/connection.js";
import { search } from "../../search/searchEngine.js";

// public_tow_company_search only has approved, non-suspended tow companies, without contact details.
/** @type {import('../../search/searchEngine.js').SearchConfig} */
const TOW_COMPANY_SEARCH = { view: "public_tow_company_search", orderBy: "d.name, d.id", limit: 200 };

export async function searchTowCompanies(query, db = pool) {
  const { hits } = await search(db, TOW_COMPANY_SEARCH, query);
  return hits.map(({ row, highlight }) => ({
    company: {
      id: row.id,
      name: row.name,
      city: row.city,
      description: row.description ?? "",
      serviceArea: row.service_area,
      tagIds: row.tag_ids,
      verified: true,
    },
    highlight,
  }));
}
