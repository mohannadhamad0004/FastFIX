import express from "express";
import cors from "cors";
import helmet from "helmet";
import { checkDatabase } from "./db/connection.js";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

// Module routers (modules/*/*.routes.js) get mounted here once implemented.

app.get("/api/health", async (_req, res) => {
  res.json({ status: "ok", database: (await checkDatabase()) ? "connected" : "not connected" });
});

app.listen(port, () => {
  console.log(`FastFix API listening on http://localhost:${port}`);
});
