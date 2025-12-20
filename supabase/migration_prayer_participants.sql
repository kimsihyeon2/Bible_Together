-- Migration: Prayer Participants tracking
-- Tracks who clicked "함께 기도했어요" for each urgent prayer

CREATE TABLE IF NOT EXISTS prayer_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_id uuid NOT NULL REFERENCES urgent_prayers(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prayed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(prayer_id, user_id)
);

-- Enable RLS
ALTER TABLE prayer_participants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view prayer participants"
    ON prayer_participants FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can add their participation"
    ON prayer_participants FOR INSERT
    WITH CHECK (true);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_prayer_participants_prayer 
    ON prayer_participants(prayer_id, prayed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prayer_participants_user 
    ON prayer_participants(user_id);

-- View for counting participants per prayer
CREATE OR REPLACE VIEW prayer_participant_counts AS
SELECT 
    prayer_id,
    COUNT(*) as participant_count,
    MAX(prayed_at) as last_prayer_at
FROM prayer_participants
GROUP BY prayer_id;
