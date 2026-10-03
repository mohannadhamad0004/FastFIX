import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import { createMemoryDatabase } from "../db/memoryDatabase.js";
import { searchTowCompanies } from "../modules/logistics/logistics.model.js";
import { findClosestVehicleName, searchParts } from "../modules/marketplace/marketplace.model.js";
import { searchMechanics } from "../modules/mechanics/mechanics.model.js";

// Runs the real migrations and seed data in PGlite (PostgreSQL compiled to WebAssembly), so the
// tests need no database server. Run with `npm test -w @fastfix/api`.

let db;

before(async () => {
  db = await createMemoryDatabase();
});

const partIds = async (query) => (await searchParts(query, db)).results.map((r) => r.part.id);

describe("part search", () => {
  test("part numbers match with or without spaces, dashes and case, exact match first", async () => {
    for (const query of ["56110-1R000", "561101R000", "56110 1r000"]) {
      const { results } = await searchParts(query, db);
      assert.equal(results[0].part.id, "p-034", query);
      assert.equal(results[0].exact, true, query);
      assert.equal(results[0].matchType, "exact", query);
    }
  });

  test("a part number prefix matches", async () => {
    const { results } = await searchParts("0986", db);
    assert.ok(results.length > 0);
    assert.ok(results.every((r) => r.highlight.numberFields.includes("manufacturerNumber")));
  });

  test("name words and a compatible vehicle must all match", async () => {
    assert.deepEqual(await partIds("steering wheel hyundai accent"), ["p-034", "p-037"]);
  });

  test("make, model and year must match the same compatible vehicle", async () => {
    // No part fits a "Hyundai Rio": only partial matches come back
    const { results } = await searchParts("hyundai rio", db);
    assert.ok(results.every((r) => r.matchType === "partial"));
    // Golf 2010 fits p-001 (Golf 2004-2013) but not p-005 (Golf 2013-2020)
    const golf2010 = await partIds("golf 2010");
    assert.ok(golf2010.includes("p-001"));
    assert.ok(!golf2010.includes("p-005"));
  });

  test("misspelled makes and models still match", async () => {
    assert.deepEqual(await partIds("hundai accent steering wheel"), ["p-034", "p-037"]);
    // "steering" also matches the Steering category: a tie rod end for the Accent
    assert.ok((await partIds("hundai accent steering")).includes("p-038"));
    assert.ok((await partIds("toyta corolla")).includes("p-035"));
    assert.ok((await partIds("mercedez")).includes("p-030"));
  });

  test("synonyms", async () => {
    assert.ok((await partIds("rotor")).includes("p-001"), "rotor -> disc");
    assert.deepEqual(await partIds("rim"), ["p-044", "p-046"], "rim -> alloy wheel, not steering wheels");
  });

  test("words that are not typos of each other don't match", async () => {
    const { results } = await searchParts("accent", db);
    assert.ok(results.every((r) => r.highlight.terms.includes("accent")), "accent must not match accessories");
  });

  test("suggests the closest make or model for a misspelled vehicle", async () => {
    assert.equal(await findClosestVehicleName("hundai", db), "Hyundai");
    assert.equal(await findClosestVehicleName("mercedez", db), "Mercedes-Benz");
  });

  test("never returns hidden parts or parts of suspended or unapproved shops", async () => {
    await db.query("UPDATE parts SET hidden_at = now(), hidden_reason = 'test' WHERE id = 'p-034'", []);
    assert.ok(!(await partIds("56110-1R000")).includes("p-034"));

    await db.query("UPDATE users SET suspended = true WHERE id = 'hebron-genuine-parts'", []);
    assert.deepEqual(await partIds("1K0615301AA"), ["p-001", "p-003"]);

    await db.query("UPDATE users SET suspended = false, status = 'pending' WHERE id = 'hebron-genuine-parts'", []);
    const { results } = await searchParts("", db);
    assert.ok(results.every((r) => r.part.shopId !== "hebron-genuine-parts"));

    await db.query("UPDATE parts SET hidden_at = NULL, hidden_reason = NULL WHERE id = 'p-034'", []);
    await db.query("UPDATE users SET status = 'approved' WHERE id = 'hebron-genuine-parts'", []);
  });
});

describe("mechanics directory", () => {
  test("searches name, city and approved skills with typos", async () => {
    const names = async (query) => (await searchMechanics(query, db)).map((r) => r.mechanic.name);
    assert.deepEqual((await names("nablis")).sort(), ["Kareem Haddad", "Nour Hamdan"]);
    assert.deepEqual((await names("hybrd")).sort(), ["Huda Barghouti", "Lina Masri"]);
  });

  test("lists only approved mechanics, with approved skills only", async () => {
    const { rows } = await db.query("SELECT id FROM users WHERE role = 'mechanic' AND status <> 'approved'", []);
    assert.ok(rows.length > 0);
    const listed = (await searchMechanics("", db)).map((r) => r.mechanic.id);
    assert.ok(rows.every((row) => !listed.includes(row.id)));

    await db.query("UPDATE mechanic_skills SET status = 'rejected' WHERE mechanic_id = 'u-10'", []);
    assert.ok(!(await searchMechanics("", db)).some((r) => r.mechanic.id === "u-10"), "no approved skill -> not public");
    await db.query("UPDATE mechanic_skills SET status = 'approved' WHERE mechanic_id = 'u-10'", []);
  });
});

describe("tow companies directory", () => {
  test("searches city, service area and tags", async () => {
    const names = async (query) => (await searchTowCompanies(query, db)).map((r) => r.company.name);
    assert.deepEqual(await names("jenin"), ["Jenin Valley Tow", "Nablus Rescue Towing"]);
    assert.deepEqual(await names("heavy vehicles"), ["Al-Bireh Road Assist"]);
  });

  test("lists only approved, non-suspended companies", async () => {
    await db.query("UPDATE users SET suspended = true WHERE id = 'u-30'", []);
    assert.ok(!(await searchTowCompanies("", db)).some((r) => r.company.id === "u-30"));
    await db.query("UPDATE users SET suspended = false WHERE id = 'u-30'", []);
  });
});
