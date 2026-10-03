import { PGlite } from "@electric-sql/pglite";
import { fuzzystrmatch } from "@electric-sql/pglite/contrib/fuzzystrmatch";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { migrate } from "./migrate.js";
import { seed } from "./seed.js";

// An in-memory PostgreSQL (PGlite, PostgreSQL compiled to WebAssembly) with the migrations applied
// and the web app's mock data loaded. Used when DATABASE_URL is not set (local development without
// a PostgreSQL install) and by the tests. Everything is lost when the process stops.

/** @returns {Promise<{ query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> }>} */
export async function createMemoryDatabase() {
  const pg = await PGlite.create({ extensions: { pg_trgm, fuzzystrmatch } });
  // Like pg, run several statements in one query() when there are no parameters (migrations).
  const db = { query: (text, params) => (params ? pg.query(text, params) : pg.exec(text).then((r) => r.at(-1))) };
  await migrate(db);
  await seed(db);
  return db;
}
