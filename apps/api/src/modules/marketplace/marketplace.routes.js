// Express router for the marketplace module.

import { Router } from "express";
import * as controller from "./marketplace.controller.js";

export const marketplaceRouter = Router();

// Public: no login needed. Only visible parts of approved, non-suspended shops.
marketplaceRouter.get("/marketplace/parts", controller.searchParts);
