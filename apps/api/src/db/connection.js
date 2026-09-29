import pg from "pg";

// One shared connection pool for the whole server.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function checkDatabase() {
  if (!process.env.DATABASE_URL) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
