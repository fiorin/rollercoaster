-- Populate 3 months of weight data for all existing people
-- Run this in Supabase SQL Editor after running setup.sql

DO $$
DECLARE
    person_record RECORD;
    entry_date DATE;
    weight_value NUMERIC(6,2);
    base_weight NUMERIC(6,2);
    days_back INTEGER := 90; -- 3 months
    person_count INTEGER := 0;
BEGIN
    -- Loop through all people
    FOR person_record IN SELECT id, name FROM people LOOP
        person_count := person_count + 1;

        -- Set a base weight for this person (between 60-80 kg)
        base_weight := 60.0 + (person_count * 5.0) + (random() * 10.0);

        -- Generate weights for the past 90 days
        FOR i IN 0..days_back LOOP
            entry_date := CURRENT_DATE - INTERVAL '1 day' * i;

            -- Add some variation to weight (±2kg random, with slight downward trend)
            weight_value := base_weight + (random() - 0.5) * 4.0 - (i * 0.01);

            -- Round to 1 decimal place
            weight_value := ROUND(weight_value * 10) / 10;

            -- Insert weight record with random activities (only if doesn't exist)
            INSERT INTO weights (person_id, date, weight, gym, bike, gloves, running)
            SELECT
                person_record.id,
                entry_date,
                weight_value,
                random() > 0.6, -- 40% chance of gym
                random() > 0.7, -- 30% chance of bike
                random() > 0.8, -- 20% chance of gloves/boxing
                random() > 0.5  -- 50% chance of running
            WHERE NOT EXISTS (
                SELECT 1 FROM weights
                WHERE person_id = person_record.id AND date = entry_date
            );
        END LOOP;

        RAISE NOTICE 'Generated % weights for %', days_back + 1, person_record.name;
    END LOOP;

    RAISE NOTICE 'Total people processed: %', person_count;
END $$;

-- Verify the data was inserted
SELECT
    p.name,
    COUNT(w.id) as weight_entries,
    MIN(w.date) as earliest_date,
    MAX(w.date) as latest_date,
    ROUND(AVG(w.weight), 2) as avg_weight,
    ROUND(MIN(w.weight), 2) as min_weight,
    ROUND(MAX(w.weight), 2) as max_weight
FROM people p
LEFT JOIN weights w ON w.person_id = p.id
GROUP BY p.id, p.name
ORDER BY p.name;