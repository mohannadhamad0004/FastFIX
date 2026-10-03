import { pathToFileURL } from "node:url";
import { seedUsers } from "../../../web/src/auth/mockUsers.js";
import { seedTags } from "../../../web/src/features/admin/mockTags.js";
import { parts } from "../../../web/src/features/marketplace/mockData.js";

// Development data: the web app's mock accounts, tags and parts, so the API returns the same
// shops, parts, mechanics and tow companies the web app shows today. Passwords and files are not
// stored (no auth or uploads in the API yet).
// Run after db:migrate with `npm run db:seed -w @fastfix/api`. Only fills an empty database.

/**
 * @param {{ query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }> }} db  one connection
 * @returns {Promise<boolean>} false when the database already had users
 */
export async function seed(db) {
  const { rows } = await db.query("SELECT count(*)::int AS count FROM users");
  if (rows[0].count > 0) return false;

  await db.query("BEGIN");
  try {
    for (const tag of seedTags) {
      await db.query("INSERT INTO tags (id, type, name, color) VALUES ($1, $2, $3, $4)", [
        tag.id,
        tag.type,
        tag.name,
        tag.color,
      ]);
    }

    for (const user of seedUsers) {
      await db.query(
        `INSERT INTO users (id, role, status, suspended, name, email, phone, city, address, workshop_name, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          user.id,
          user.role,
          user.status,
          user.suspended,
          user.name,
          user.email,
          user.phone || null,
          user.city ?? null,
          user.address ?? null,
          user.workshopName ?? null,
          user.description ?? null,
          user.createdAt,
        ],
      );
      for (const tagId of user.tagIds) {
        await db.query("INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)", [user.id, tagId]);
      }
      for (const skill of user.skills ?? []) {
        await db.query(
          "INSERT INTO mechanic_skills (id, mechanic_id, skill, years, status) VALUES ($1, $2, $3, $4, $5)",
          [skill.id, user.id, skill.skill, skill.years, skill.status],
        );
      }
      for (const city of user.serviceArea ?? []) {
        await db.query("INSERT INTO tow_service_areas (tow_id, city) VALUES ($1, $2)", [user.id, city]);
      }
    }

    const variantId = variantLookup(db);
    for (const part of parts) {
      await db.query(
        `INSERT INTO parts (id, shop_id, name, oem_number, manufacturer_number, brand, category, type, condition,
                            price_ils, stock, added_at, hidden_reason, hidden_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          part.id,
          part.shopId,
          part.name,
          part.oemNumber || null,
          part.manufacturerNumber || null,
          part.brand,
          part.category,
          part.type,
          part.condition,
          part.priceIls,
          part.stock,
          part.addedAt,
          part.hidden?.reason ?? null,
          part.hidden?.hiddenAt ?? null,
        ],
      );
      for (const [position, fitment] of part.fitments.entries()) {
        await db.query(
          `INSERT INTO part_fitments (part_id, variant_id, position) VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [part.id, await variantId(fitment), position],
        );
      }
      for (const tagId of part.tagIds ?? []) {
        await db.query("INSERT INTO part_tags (part_id, tag_id) VALUES ($1, $2)", [part.id, tagId]);
      }
    }

    await db.query("COMMIT");
    return true;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

// Finds or creates the make, model and variant of a fitment and returns the variant id.
function variantLookup(db) {
  const ids = new Map();
  const upsert = async (key, sql, params) => {
    if (!ids.has(key)) ids.set(key, (await db.query(sql, params)).rows[0].id);
    return ids.get(key);
  };

  return async ({ make, model, yearFrom, yearTo }) => {
    const makeId = await upsert(
      `make:${make}`,
      "INSERT INTO vehicle_makes (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id",
      [make],
    );
    const modelId = await upsert(
      `model:${make}:${model}`,
      `INSERT INTO vehicle_models (make_id, name) VALUES ($1, $2)
       ON CONFLICT (make_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [makeId, model],
    );
    return upsert(
      `variant:${make}:${model}:${yearFrom}:${yearTo}`,
      `INSERT INTO vehicle_variants (model_id, year_from, year_to) VALUES ($1, $2, $3)
       ON CONFLICT (model_id, year_from, year_to) DO UPDATE SET year_from = EXCLUDED.year_from RETURNING id`,
      [modelId, yearFrom, yearTo],
    );
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set: the API uses an in-memory database, seeded when it starts.");
    process.exit(0);
  }
  const { pool } = await import("./connection.js");
  const client = await pool.connect();
  try {
    console.log((await seed(client)) ? "Seeded the database." : "Database already has data - nothing seeded.");
  } finally {
    client.release();
    await pool.end();
  }
}
