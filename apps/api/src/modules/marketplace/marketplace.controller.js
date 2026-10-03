// Request handlers for the marketplace module.

import * as service from "./marketplace.service.js";
import { queryText } from "../../search/queryText.js";

// GET /api/marketplace/parts?q=steering+wheel+hyundai+accent
export async function searchParts(req, res) {
  res.json(await service.searchParts(queryText(req)));
}
