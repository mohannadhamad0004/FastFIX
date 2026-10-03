// Request handlers for the logistics module.

import * as service from "./logistics.service.js";
import { queryText } from "../../search/queryText.js";

// GET /api/tow-companies?q=nablus
export async function searchTowCompanies(req, res) {
  res.json(await service.searchTowCompanies(queryText(req)));
}
