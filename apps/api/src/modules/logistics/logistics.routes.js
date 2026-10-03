// Express router for the logistics module.

import { Router } from "express";
import * as controller from "./logistics.controller.js";

export const logisticsRouter = Router();

// Public directory: approved, non-suspended tow companies only.
logisticsRouter.get("/tow-companies", controller.searchTowCompanies);
