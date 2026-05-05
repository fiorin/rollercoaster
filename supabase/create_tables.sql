-- Supabase / Postgres schema for rollercoaster app
-- Run this with psql or the Supabase SQL editor

-- Enable the uuid generation function (Supabase provides pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Avatars table stores the 10 avatar image paths (seedable)
CREATE TABLE IF NOT EXISTS avatars (
  id integer PRIMARY KEY,
  image_url text NOT NULL
);

-- People table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_id integer REFERENCES avatars(id),
  created_at timestamptz DEFAULT now()
);

-- Weights recorded per person (or null person for anonymous)
CREATE TABLE IF NOT EXISTS weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  date date NOT NULL,
  weight numeric(6,2) NOT NULL,
  gym boolean DEFAULT false,
  bike boolean DEFAULT false,
  gloves boolean DEFAULT false,
  running boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_weights_person_date ON weights(person_id, date DESC);

-- Example view joining weights and people
CREATE OR REPLACE VIEW weights_with_people AS
SELECT
  w.*,
  p.name AS person_name,
  p.avatar_id
FROM weights w
LEFT JOIN people p ON p.id = w.person_id;

-- NOTE: Add RLS and policies if you plan to expose this directly to the client.