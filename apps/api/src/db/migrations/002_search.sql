-- Search: fuzzy matching, part number normalization, synonyms, and the public search views.
-- How the search uses them: src/search/README.md.

CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- trigram similarity: ranks typo candidates, "Did you mean"
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;  -- levenshtein: how many typos a word has

-- "56110-1R000", "561101R000" and "56110 1r000" -> "561101r000". Must match normalizePartNumber in
-- src/search/parseQuery.js.
CREATE FUNCTION normalize_part_number(value text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT lower(regexp_replace(value, '[^[:alnum:]]+', '', 'g')) $$;

-- The distinct lowercase words of a text: 'Mercedes-Benz C-Class' -> {benz, c, class, mercedes}
CREATE FUNCTION search_words(value text) RETURNS text[]
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$
    SELECT coalesce(array_agg(DISTINCT word), '{}')
    FROM regexp_split_to_table(lower(coalesce(value, '')), '[^[:alnum:]]+') AS word
    WHERE word <> ''
  $$;

ALTER TABLE parts
  ADD COLUMN oem_number_norm text GENERATED ALWAYS AS (normalize_part_number(oem_number)) STORED,
  ADD COLUMN manufacturer_number_norm text GENERATED ALWAYS AS (normalize_part_number(manufacturer_number)) STORED;

-- Exact and prefix part number lookups (LIKE '5611%')
CREATE INDEX parts_oem_number_norm_idx ON parts (oem_number_norm text_pattern_ops);
CREATE INDEX parts_manufacturer_number_norm_idx ON parts (manufacturer_number_norm text_pattern_ops);

-- "Did you mean: Hyundai?" looks up the closest make or model name with the % operator.
CREATE INDEX vehicle_makes_name_trgm_idx ON vehicle_makes USING gin (lower(name) gin_trgm_ops);
CREATE INDEX vehicle_models_name_trgm_idx ON vehicle_models USING gin (lower(name) gin_trgm_ops);

-- A query word also matches its synonyms: "rotor" finds "Front brake disc". A synonym can be
-- several words; a result then needs all of them, so "rim" -> "alloy wheel" finds alloy wheels
-- but not steering wheels. Plurals are covered: "rims" uses the synonyms of "rim".
-- Insert rows to add more.
CREATE TABLE search_synonyms (
  word    text NOT NULL CHECK (word = lower(word) AND word ~ '^[[:alnum:]]+$'),
  synonym text NOT NULL CHECK (synonym = lower(synonym)),
  PRIMARY KEY (word, synonym)
);

INSERT INTO search_synonyms (word, synonym) VALUES
  ('rim', 'alloy wheel'),
  ('rim', 'steel wheel'),
  ('disc', 'rotor'),
  ('rotor', 'disc'),
  ('disk', 'disc'),
  ('bulb', 'lamp'),
  ('lamp', 'bulb'),
  ('shock', 'shock absorber'),
  ('damper', 'shock absorber'),
  ('headlamp', 'headlight'),
  ('tyre', 'tire'),
  ('tyres', 'tire'),
  ('gearbox', 'transmission'),
  ('muffler', 'exhaust'),
  ('silencer', 'exhaust'),
  ('windscreen', 'windshield'),
  ('aircon', 'ac');

-- ---- Public search views --------------------------------------------------------------------
-- Every public read goes through these views, so the visibility rules live in one place:
-- no hidden parts, no parts from pending, rejected or suspended shops, and only approved,
-- non-suspended mechanics and tow companies. Contact details are never selected.
--
-- Each search view has one row per searchable item with:
--   words       every searchable word of the item
--   name_words  words of its name (a match there ranks higher)
--   text_words  (parts only) words not coming from compatible vehicles

CREATE VIEW public_shops AS
  SELECT id, name, city, description
  FROM users
  WHERE role = 'parts_shop' AND status = 'approved' AND NOT suspended;

-- One row per part and vehicle variant it fits. Only read through public_part_search.
CREATE VIEW part_fitment_vehicles AS
  SELECT pf.part_id,
         pf.position,
         mk.name AS make,
         md.name AS model,
         v.year_from,
         v.year_to,
         search_words(mk.name || ' ' || md.name) AS words
  FROM part_fitments pf
  JOIN vehicle_variants v ON v.id = pf.variant_id
  JOIN vehicle_models md ON md.id = v.model_id
  JOIN vehicle_makes mk ON mk.id = md.make_id;

CREATE VIEW public_part_search AS
  SELECT p.id,
         p.shop_id,
         p.name,
         p.oem_number,
         p.manufacturer_number,
         p.oem_number_norm,
         p.manufacturer_number_norm,
         p.brand,
         p.category,
         p.type,
         p.condition,
         p.price_ils::float8 AS price_ils,
         p.stock,
         to_char(p.added_at, 'YYYY-MM-DD') AS added_at,
         s.name AS shop_name,
         s.city AS shop_city,
         coalesce(f.fitments, '[]') AS fitments,
         coalesce(t.tag_ids, '{}') AS tag_ids,
         search_words(concat_ws(' ', p.name, p.category, p.brand, t.tag_names)) AS text_words,
         search_words(concat_ws(' ', p.name, p.category, p.brand, t.tag_names, f.vehicles)) AS words,
         search_words(p.name) AS name_words
  FROM parts p
  JOIN public_shops s ON s.id = p.shop_id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(
             jsonb_build_object('make', make, 'model', model, 'yearFrom', year_from, 'yearTo', year_to)
             ORDER BY position
           ) AS fitments,
           string_agg(make || ' ' || model, ' ') AS vehicles
    FROM part_fitment_vehicles
    WHERE part_id = p.id
  ) f ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(tg.id ORDER BY tg.id) AS tag_ids, string_agg(tg.name, ' ') AS tag_names
    FROM part_tags pt
    JOIN tags tg ON tg.id = pt.tag_id
    WHERE pt.part_id = p.id
  ) t ON true
  WHERE p.hidden_at IS NULL;

-- A mechanic is public only with at least one approved skill, and only approved skills are shown.
CREATE VIEW public_mechanic_search AS
  SELECT u.id,
         u.name,
         u.city,
         u.workshop_name,
         u.address,
         sk.skills,
         coalesce(t.tag_ids, '{}') AS tag_ids,
         search_words(concat_ws(' ', u.name, u.workshop_name, u.city, sk.skill_names, t.tag_names)) AS words,
         search_words(concat_ws(' ', u.name, u.workshop_name)) AS name_words
  FROM users u
  JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', id, 'skill', skill, 'years', years) ORDER BY id) AS skills,
           string_agg(skill, ' ') AS skill_names
    FROM mechanic_skills
    WHERE mechanic_id = u.id AND status = 'approved'
  ) sk ON sk.skills IS NOT NULL
  LEFT JOIN LATERAL (
    SELECT array_agg(tg.id ORDER BY tg.id) AS tag_ids, string_agg(tg.name, ' ') AS tag_names
    FROM user_tags ut
    JOIN tags tg ON tg.id = ut.tag_id
    WHERE ut.user_id = u.id
  ) t ON true
  WHERE u.role = 'mechanic' AND u.status = 'approved' AND NOT u.suspended;

CREATE VIEW public_tow_company_search AS
  SELECT u.id,
         u.name,
         u.city,
         u.description,
         coalesce(a.service_area, '{}') AS service_area,
         coalesce(t.tag_ids, '{}') AS tag_ids,
         search_words(concat_ws(' ', u.name, u.city, a.cities, t.tag_names)) AS words,
         search_words(u.name) AS name_words
  FROM users u
  LEFT JOIN LATERAL (
    SELECT array_agg(city ORDER BY city) AS service_area, string_agg(city, ' ') AS cities
    FROM tow_service_areas
    WHERE tow_id = u.id
  ) a ON true
  LEFT JOIN LATERAL (
    SELECT array_agg(tg.id ORDER BY tg.id) AS tag_ids, string_agg(tg.name, ' ') AS tag_names
    FROM user_tags ut
    JOIN tags tg ON tg.id = ut.tag_id
    WHERE ut.user_id = u.id
  ) t ON true
  WHERE u.role = 'tow' AND u.status = 'approved' AND NOT u.suspended;
