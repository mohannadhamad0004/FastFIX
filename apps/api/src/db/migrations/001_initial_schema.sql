-- Accounts, tags, vehicles and parts: the tables the marketplace and the public directories read.
-- Ids are text so the seeded ids match the web app's mock data ("u-10", "alquds-auto-parts", "p-001").

CREATE TABLE users (
  id            text PRIMARY KEY,
  role          text NOT NULL CHECK (role IN ('customer', 'mechanic', 'parts_shop', 'tow', 'admin')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  suspended     boolean NOT NULL DEFAULT false,  -- suspended users can't log in and are never public
  name          text NOT NULL,                   -- person's name, or company name for parts_shop and tow
  email         text NOT NULL UNIQUE,
  phone         text,
  city          text,                            -- mechanic, parts_shop, tow
  address       text,
  workshop_name text,                            -- mechanic
  description   text,                            -- parts_shop, tow
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Admin-managed tags ("Best Seller", "Top Rated", "24/7")
CREATE TABLE tags (
  id    text PRIMARY KEY,
  type  text NOT NULL CHECK (type IN ('part', 'mechanic', 'tow')),
  name  text NOT NULL,
  color text NOT NULL
);

-- Tags on mechanics and tow companies
CREATE TABLE user_tags (
  user_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tag_id  text NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tag_id)
);

-- Each skill is reviewed on its own; only approved skills are public.
CREATE TABLE mechanic_skills (
  id          text PRIMARY KEY,
  mechanic_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  skill       text NOT NULL,
  years       integer NOT NULL CHECK (years >= 0),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);
CREATE INDEX mechanic_skills_mechanic_id_idx ON mechanic_skills (mechanic_id);

-- Cities a tow company covers
CREATE TABLE tow_service_areas (
  tow_id text NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  city   text NOT NULL,
  PRIMARY KEY (tow_id, city)
);

CREATE TABLE vehicle_makes (
  id   serial PRIMARY KEY,
  name text NOT NULL UNIQUE                      -- "Hyundai", "Mercedes-Benz"
);

CREATE TABLE vehicle_models (
  id      serial PRIMARY KEY,
  make_id integer NOT NULL REFERENCES vehicle_makes (id),
  name    text NOT NULL,                         -- "Accent", "C-Class"
  UNIQUE (make_id, name)
);

-- One model over a range of years. Parts fit variants through part_fitments.
CREATE TABLE vehicle_variants (
  id        serial PRIMARY KEY,
  model_id  integer NOT NULL REFERENCES vehicle_models (id),
  year_from integer NOT NULL,
  year_to   integer NOT NULL,
  CHECK (year_from <= year_to),
  UNIQUE (model_id, year_from, year_to)
);

CREATE TABLE parts (
  id                  text PRIMARY KEY,
  shop_id             text NOT NULL REFERENCES users (id) ON DELETE CASCADE,  -- the owning parts_shop account
  name                text NOT NULL,
  oem_number          text,                      -- car maker's part number
  manufacturer_number text,                      -- part maker's own number (Bosch, Mann-Filter, ...)
  brand               text NOT NULL,
  category            text NOT NULL,
  type                text NOT NULL CHECK (type IN ('oem', 'aftermarket')),
  condition           text NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
  price_ils           numeric(10, 2) NOT NULL CHECK (price_ils >= 0),
  stock               integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  added_at            date NOT NULL DEFAULT current_date,
  hidden_reason       text,                      -- set by an admin; hidden parts are never public
  hidden_at           timestamptz
);
CREATE INDEX parts_shop_id_idx ON parts (shop_id);

-- Which vehicles a part fits. A part can fit many variants, which is how parts shared across
-- models (Golf, Jetta, Octavia, A3) are stored.
CREATE TABLE part_fitments (
  part_id    text NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
  variant_id integer NOT NULL REFERENCES vehicle_variants (id),
  position   integer NOT NULL DEFAULT 0,       -- display order in the part's "Fits:" line
  PRIMARY KEY (part_id, variant_id)
);
CREATE INDEX part_fitments_variant_id_idx ON part_fitments (variant_id);

-- Admin-assigned tags on parts. Only admins change them.
CREATE TABLE part_tags (
  part_id text NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
  tag_id  text NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (part_id, tag_id)
);
