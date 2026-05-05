-- Add unique constraint to weights table if it doesn't exist
-- Run this before populate_weights.sql if you get constraint errors

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'weights_person_date_unique'
    ) THEN
        ALTER TABLE weights ADD CONSTRAINT weights_person_date_unique UNIQUE (person_id, date);
        RAISE NOTICE 'Added unique constraint on weights (person_id, date)';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;