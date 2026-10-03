import { readdir, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Applies migrations/*.sql in file name order. Each file runs once, in its own transaction, and is
// recorded in schema_migrations. Run with `npm run db:migrate -w @fastfix/api`.

const MIGRATIONS_DIR = new URL("./migrations/", import.meta.url);

/**
 * @param {{ query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> }} db
 *   one connection (a pg client, not the pool, so the transaction stays on it)
 * @returns {Promise<string[]>} the files applied now
 */
export async function migrate(db) {
  await db.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const { rows } = await db.query("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith(".sql")).sort();

  const ran = [];
  for (const file of files.filter((f) => !applied.has(f))) {
    const sql = await readFile(new URL(file, MIGRATIONS_DIR), "utf8");
    await db.query("BEGIN");
    try {
      await db.query(sql);
      await db.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
    }
    ran.push(file);
  }
  return ran;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set: the API uses an in-memory database, migrated when it starts.");
    process.exit(0);
  }
  const { pool } = await import("./connection.js");
  const client = await pool.connect();
  try {
    const ran = await migrate(client);
    console.log(ran.length ? `Applied: ${ran.join(", ")}` : "Database is up to date.");
  } finally {
    client.release();
    await pool.end();
  }
}
