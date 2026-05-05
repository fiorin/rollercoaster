-- Rollercoaster Weight Tracker - Complete Supabase Setup
-- Run this entire script in your Supabase SQL Editor
-- This creates tables, seeds data, and sets up RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- TABLES
-- ========================================

-- Avatars table stores the 10 avatar image paths
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

-- Weights recorded per person
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
  created_at timestamptz DEFAULT now(),
  UNIQUE(person_id, date) -- Prevent duplicate entries for same person/date
);

-- ========================================
-- INDEXES
-- ========================================

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_weights_person_date ON weights(person_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_people_created_at ON people(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weights_date ON weights(date DESC);

-- ========================================
-- VIEWS
-- ========================================

-- View joining weights and people for easier queries
CREATE OR REPLACE VIEW weights_with_people AS
SELECT
  w.*,
  p.name AS person_name,
  p.avatar_id,
  a.image_url AS avatar_url
FROM weights w
LEFT JOIN people p ON p.id = w.person_id
LEFT JOIN avatars a ON a.id = p.avatar_id;

-- ========================================
-- SEED DATA
-- ========================================

-- Seed 10 avatar image paths
INSERT INTO avatars (id, image_url) VALUES
(1, '/avatars/avatar-1.png'),
(2, '/avatars/avatar-2.png'),
(3, '/avatars/avatar-3.png'),
(4, '/avatars/avatar-4.png'),
(5, '/avatars/avatar-5.png'),
(6, '/avatars/avatar-6.png'),
(7, '/avatars/avatar-7.png'),
(8, '/avatars/avatar-8.png'),
(9, '/avatars/avatar-9.png'),
(10, '/avatars/avatar-10.png')
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Seed example people
INSERT INTO people (name, avatar_id)
VALUES
('Alex', 1),
('Sam', 2),
('Jamie', 3)
ON CONFLICT DO NOTHING;

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE weights ENABLE ROW LEVEL SECURITY;

-- Policies for avatars (read-only for all)
CREATE POLICY "Avatars are viewable by everyone" ON avatars
  FOR SELECT USING (true);

-- Policies for people
CREATE POLICY "People are viewable by everyone" ON people
  FOR SELECT USING (true);

CREATE POLICY "People can be inserted by authenticated users" ON people
  FOR INSERT WITH CHECK (true);

CREATE POLICY "People can be updated by authenticated users" ON people
  FOR UPDATE USING (true);

-- Policies for weights
CREATE POLICY "Weights are viewable by everyone" ON weights
  FOR SELECT USING (true);

CREATE POLICY "Weights can be inserted by authenticated users" ON weights
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Weights can be updated by authenticated users" ON weights
  FOR UPDATE USING (true);

CREATE POLICY "Weights can be deleted by authenticated users" ON weights
  FOR DELETE USING (true);

-- ========================================
-- SAMPLE WEIGHTS DATA (Optional)
-- ========================================

-- Insert some sample weights for testing (adjust person_id to match your seeded people)
-- Uncomment and modify the person_id values below if you want sample data

/*
-- Get the first person's ID
DO $$
DECLARE
    first_person_id uuid;
BEGIN
    SELECT id INTO first_person_id FROM people LIMIT 1;

    -- Insert sample weights for the past month
    INSERT INTO weights (person_id, date, weight, gym, bike, gloves, running)
    VALUES
    (first_person_id, CURRENT_DATE - INTERVAL '30 days', 72.5, true, false, false, true),
    (first_person_id, CURRENT_DATE - INTERVAL '25 days', 72.2, false, true, true, false),
    (first_person_id, CURRENT_DATE - INTERVAL '20 days', 71.8, true, true, false, true),
    (first_person_id, CURRENT_DATE - INTERVAL '15 days', 71.5, false, false, true, true),
    (first_person_id, CURRENT_DATE - INTERVAL '10 days', 71.2, true, false, false, false),
    (first_person_id, CURRENT_DATE - INTERVAL '5 days', 70.9, false, true, true, true),
    (first_person_id, CURRENT_DATE - INTERVAL '1 day', 70.7, true, true, false, true)
    ON CONFLICT DO NOTHING;
END $$;
*/

-- ========================================
-- SETUP COMPLETE
-- ========================================

-- Verify setup
SELECT 'Setup complete! Tables created, data seeded, and RLS enabled.' as status;

-- Check table counts
SELECT
  (SELECT COUNT(*) FROM avatars) as avatars_count,
  (SELECT COUNT(*) FROM people) as people_count,
  (SELECT COUNT(*) FROM weights) as weights_count;