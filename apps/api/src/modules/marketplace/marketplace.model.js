// Database queries for the marketplace module.

import { pool } from "../../db/connection.js";
import { search } from "../../search/searchEngine.js";

// Parts search over public_part_search, which already leaves out hidden parts and parts from
// pending, rejected or suspended shops.
/** @type {import('../../search/searchEngine.js').SearchConfig} */
export const PART_SEARCH = {
  view: "public_part_search",
  numberColumns: [
    { column: "oem_number_norm", field: "oemNumber" },
    { column: "manufacturer_number_norm", field: "manufacturerNumber" },
  ],
  fitments: { view: "part_fitment_vehicles", key: "part_id" },
  orderBy: "d.id",
  // The web app filters and sorts the results itself, so return all of them (the catalog is small).
  limit: 500,
};

// A row of public_part_search in the shape of the web app's Part (features/marketplace/types.js)
function toPart(row) {
  return {
    id: row.id,
    name: row.name,
    oemNumber: row.oem_number ?? "",
    manufacturerNumber: row.manufacturer_number ?? "",
    brand: row.brand,
    category: row.category,
    type: row.type,
    condition: row.condition,
    priceIls: row.price_ils,
    stock: row.stock,
    shopId: row.shop_id,
    addedAt: row.added_at,
    fitments: row.fitments,
    tagIds: row.tag_ids,
  };
}

export async function searchParts(query, db = pool) {
  const { hits, words, goodResult } = await search(db, PART_SEARCH, query);
  return {
    results: hits.map(({ row, exact, matchType, highlight }) => ({
      part: toPart(row),
      shop: { id: row.shop_id, name: row.shop_name, city: row.shop_city },
      exact,
      matchType,
      highlight,
    })),
    words,
    goodResult,
  };
}

// The make or model name closest to a (misspelled) word, by trigram similarity: "hundai" -> "Hyundai".
// Only vehicles that some public part fits. null when nothing is similar enough.
export async function findClosestVehicleName(word, db = pool) {
  const { rows } = await db.query(
    `SELECT name
     FROM (
       SELECT mk.name FROM vehicle_makes mk WHERE lower(mk.name) % $1
       UNION
       SELECT md.name FROM vehicle_models md WHERE lower(md.name) % $1
     ) candidates
     WHERE EXISTS (
       SELECT 1 FROM public_part_search p, jsonb_array_elements(p.fitments) f
       WHERE f->>'make' = candidates.name OR f->>'model' = candidates.name
     )
     ORDER BY similarity(lower(name), $1) DESC, name
     LIMIT 1`,
    [word],
  );
  return rows[0]?.name ?? null;
}
