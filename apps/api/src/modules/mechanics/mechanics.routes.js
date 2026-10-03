// Express router for the mechanics module.

import { Router } from "express";
import * as controller from "./mechanics.controller.js";

export const mechanicsRouter = Router();

// Public directory: approved, non-suspended mechanics with approved skills only.
mechanicsRouter.get("/mechanics", controller.searchMechanics);
