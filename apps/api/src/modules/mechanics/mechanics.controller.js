// Request handlers for the mechanics module.

import * as service from "./mechanics.service.js";
import { queryText } from "../../search/queryText.js";

// GET /api/mechanics?q=brakes+nablus
export async function searchMechanics(req, res) {
  res.json(await service.searchMechanics(queryText(req)));
}
