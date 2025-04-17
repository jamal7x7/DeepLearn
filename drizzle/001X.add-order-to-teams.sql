-- Add 'order' column to teams table for persistent ordering
ALTER TABLE teams ADD COLUMN "order" integer DEFAULT 0;

-- Optionally, backfill current order by id
-- UPDATE teams SET "order" = id;
