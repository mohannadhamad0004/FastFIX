# search

One search engine for the parts marketplace, the mechanics directory and the tow companies directory. It runs in PostgreSQL: the database parts are in `db/migrations/002_search.sql`, and the JavaScript is here.

| File | Purpose |
| --- | --- |
| `parseQuery.js` | Splits the query into words, drops stop words, normalizes part numbers, spots years. No database. |
| `searchEngine.js` | `search(db, config, query)`: matches words to the items' words, builds one ranked SQL query |
| `queryText.js` | Reads `?q=` from a request |

| Endpoint | Module | View | Searches |
| --- | --- | --- | --- |
| `GET /api/marketplace/parts?q=` | `marketplace` | `public_part_search` | name, category, brand, tags, compatible makes and models, fitment years, OEM and manufacturer numbers |
| `GET /api/mechanics?q=` | `mechanics` | `public_mechanic_search` | name, workshop, city, approved skills, tags |
| `GET /api/tow-companies?q=` | `logistics` | `public_tow_company_search` | name, city, service area, tags |

## Visibility

Every search reads a `public_*` view, never the tables directly. The views are the only place the rules live:

- parts: not hidden by an admin, and the owning shop is approved and not suspended
- mechanics: approved, not suspended, at least one approved skill; only approved skills are listed and searched
- tow companies: approved and not suspended
- no contact details (email, phone) are selected

## How a query is matched

Example: `steering wheel hundai accent`

1. **Parse** (`parseQuery.js`). Split on spaces, drop stop words ("for", "my", ...). Each word is split into tokens on punctuation (`C-Class` → `class`), and also normalized as a part number by removing everything but letters and digits and lowercasing (`56110-1R000` → `561101r000`). `2015` is also a year.
2. **Vocabulary** (`matchVocabulary`). Each token is compared with every distinct word of the view's `words` column:
   - the same word, or a word it starts with (`hyun` → `hyundai`)
   - a typo: `levenshtein` distance within the budget (up to 3 letters: 0, 4-5 letters: 1, longer: 2)
   - long words (7+ letters) also count when the `pg_trgm` `similarity` is 0.5 or more (`mercedesbenz` → `mercedes`)

   If a token has an exact match, only that counts. Otherwise its prefixes count, plus the typo fixes whose trigram similarity is within 0.1 of the best one.
3. **Synonyms** (`search_synonyms` table). `rotor` also matches `disc`. A synonym can be a phrase: `rim` → `alloy wheel` needs both words, so steering wheels don't match. Plurals use the singular's synonyms (`rims` → `rim`). To add synonyms, insert rows; no code change is needed.
4. **Vehicle words**. A token whose matches are all make or model words (`hyundai`, `accent`), or a year, is a vehicle word. All the vehicle words of a query must match **one** row of `part_fitment_vehicles`, so `hyundai accent 2015` needs a Hyundai Accent fitment that covers 2015. A part that fits a Hyundai Elantra and a Kia Rio does not match `hyundai rio`.
5. **One SQL query** (`buildQuery`). Every other word must match some searchable field (array overlap on `words`) or be the start of a part number. Values are always bind parameters (`$1`, `$2`, ...). Only view and column names from code are put into the SQL text.

## Ranking

1. The whole query equals an OEM or manufacturer number ("Exact part number match")
2. Items matching every word (or the whole part number typed with spaces, `56110 1r0`)
3. More words matched, then fewer typos, then more words matched in the name, then the view's default order

If no item matches every word, the items matching some of the words are returned with `matchType: "partial"`. If no item matches every word without a typo, the marketplace suggests the closest make or model name ("Did you mean: Hyundai?"). The suggestion comes from a `%` trigram lookup, which the GIN indexes on `vehicle_makes` and `vehicle_models` speed up.

## Why levenshtein as well as pg_trgm

Trigram similarity is good at finding and ranking candidates, but it can't reliably tell a typo from a different word. Measured on PostgreSQL 17 (PGlite):

| Query word | Item word | `similarity` | `levenshtein` |
| --- | --- | --- | --- |
| hundai | hyundai | 0.50 | 1 |
| toyta | toyota | 0.44 | 1 |
| breaks | brakes | 0.17 | 2 |
| brake | bracket | 0.27 | 2 |
| accent | accessories | 0.27 (`word_similarity` 0.57, the same as hundai) | 7 |

A trigram threshold low enough to accept "breaks" would also accept "bracket". The typo budget on `levenshtein` accepts every real typo above and rejects "accessories". `fuzzystrmatch` (which provides `levenshtein`) ships with PostgreSQL, like `pg_trgm`.

## Scaling up

The catalog is small, so the views are computed on every query and each token is compared with the whole vocabulary. That takes a few milliseconds. With many thousands of parts:

- Store the vocabulary (distinct words with an `in_text` flag) in a table or materialized view with a `gin_trgm_ops` index. Refresh it when parts change, and find typo candidates with the `%` operator (index-backed) before checking `levenshtein`.
- Store each part's `words` in a column (kept up to date by triggers) with a GIN index, so `words && $1` uses the index.
- Page the results (`LIMIT`/`OFFSET` or keyset) and move the web app's filters into the SQL `WHERE`.

## Adding semantic search later (embeddings)

This is not built: the data is small, and embeddings would add cost and an external dependency. When it's worth it, for example for "car shakes when braking" → brake discs:

1. Install the [`pgvector`](https://github.com/pgvector/pgvector) extension and add `embedding vector(N)` to `parts`, where N is the embedding model's dimension. Add an HNSW index for cosine distance.
2. When a part is created or changed, build a text such as "Front brake disc, Brakes, Bosch, fits Volkswagen Golf 2004-2013, ..." and store its embedding. Do this in a background job, because it calls a paid API. That call belongs in `apps/api` only, with the key in `.env`, like the AI diagnosis. The provider rule in CLAUDE.md applies: only the diagnosis module talks to the AI provider through `ai-provider.js`, so the rule would need extending for embeddings, or the embedding call would live in that module.
3. At query time, embed the query and fetch the nearest parts from `public_part_search` (visibility rules still apply).
4. Merge the two lists, for example with reciprocal rank fusion: score = Σ 1 / (60 + rank in each list). Keep exact part number matches first and keep the vehicle fitment rule as a hard filter, because embeddings are bad at exact codes and at "Accent vs Elantra".
5. Cache query embeddings, because the same searches repeat.

The keyword engine stays in place either way: part numbers, makes and models need exact and typo-tolerant matching, which embeddings don't provide.
