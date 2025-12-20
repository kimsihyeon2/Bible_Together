-- =============================================
-- Migration: Roles & Features Update
-- 1. Update profiles role enum to include 'SUB_ADMIN'
-- 2. Ensure prayer_participants table exists
-- 3. Update urgent_prayers RLS for deletion
-- =============================================

-- 1. Update profiles role constraint
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
    END IF;
END $$;

-- Add new constraint with SUB_ADMIN
ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('MEMBER', 'LEADER', 'SUB_ADMIN', 'PASTOR'));

-- 2. Ensure prayer_participants table exists (if not already created by previous migration)
CREATE TABLE IF NOT EXISTS prayer_participants (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prayer_id uuid NOT NULL REFERENCES urgent_prayers(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    prayed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(prayer_id, user_id)
);

-- Enable RLS
ALTER TABLE prayer_participants ENABLE ROW LEVEL SECURITY;

-- Policies for participants
DROP POLICY IF EXISTS "Anyone can view prayer participants" ON prayer_participants;
CREATE POLICY "Anyone can view prayer participants"
    ON prayer_participants FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can add their participation" ON prayer_participants;
CREATE POLICY "Authenticated users can add their participation"
    ON prayer_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Update urgent_prayers RLS for Delete/Active Toggle
-- Allow PASTOR (Admin) to delete ANY prayer
DROP POLICY IF EXISTS "Admins can delete urgent prayers" ON urgent_prayers;
CREATE POLICY "Admins can delete urgent prayers" 
    ON urgent_prayers FOR DELETE 
    TO authenticated 
    USING (
        exists (select 1 from profiles where id = auth.uid() and role = 'PASTOR')
        OR created_by = auth.uid()
    );

-- Allow PASTOR to update ANY prayer (for deactivation)
DROP POLICY IF EXISTS "Admins can update urgent prayers" ON urgent_prayers;
CREATE POLICY "Admins can update urgent prayers" 
    ON urgent_prayers FOR UPDATE 
    TO authenticated 
    USING (
        exists (select 1 from profiles where id = auth.uid() and role = 'PASTOR')
        OR created_by = auth.uid()
    );

-- 4. Create view for easy counting (optional but helpful)
CREATE OR REPLACE VIEW prayer_participant_counts AS
SELECT 
    prayer_id,
    COUNT(*) as participant_count,
    MAX(prayed_at) as last_prayer_at
FROM prayer_participants
GROUP BY prayer_id;

-- 5. Helper function to check role hierarchy
CREATE OR REPLACE FUNCTION is_admin_or_sub() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('PASTOR', 'SUB_ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
