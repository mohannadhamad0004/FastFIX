import pg from "pg";

// With DATABASE_URL: a real PostgreSQL server. Without it (local development): an in-memory
// database with the mock data (memoryDatabase.js), created on first use. It resets on restart.
export const usingMemoryDatabase = !process.env.DATABASE_URL;

// One shared connection pool for the whole server. Models only call pool.query().
export const pool = usingMemoryDatabase
  ? createMemoryPool()
  : new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });

function createMemoryPool() {
  let ready;
  const database = () =>
    (ready ??= import("./memoryDatabase.js")
      .then(({ createMemoryDatabase }) => createMemoryDatabase())
      .catch((error) => {
        ready = undefined; // try again on the next query
        throw error;
      }));
  return { query: async (text, params) => (await database()).query(text, params) };
}

export async function checkDatabase() {
  try {
    await pool.query("SELECT 1", []);
    return true;
  } catch {
    return false;
  }
}
