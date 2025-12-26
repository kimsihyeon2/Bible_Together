-- Migration: Update calendar_events for date range support
-- Changes: event_date → start_date + end_date

-- 1. Add new columns
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS start_date date,
ADD COLUMN IF NOT EXISTS end_date date;

-- 2. Migrate existing data
UPDATE calendar_events 
SET start_date = event_date, end_date = event_date 
WHERE start_date IS NULL;

-- 3. Make start_date NOT NULL (after migration)
ALTER TABLE calendar_events 
ALTER COLUMN start_date SET NOT NULL;

-- 4. Set default for end_date (same as start_date if not provided)
-- Note: This is handled in the frontend

-- 5. Drop old column (optional - can keep for backward compatibility)
-- ALTER TABLE calendar_events DROP COLUMN IF EXISTS event_date;

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_range 
ON calendar_events(start_date, end_date);
