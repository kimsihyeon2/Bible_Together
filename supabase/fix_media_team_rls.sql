-- Fix Media Team RLS for Public Read Access
-- Run this in Supabase SQL Editor if media team data is not visible to regular users

-- 1. Drop existing SELECT policy (if any issues)
DROP POLICY IF EXISTS "Media team members are viewable by everyone" ON media_team_members;

-- 2. Create ANON-friendly policy (allows unauthenticated + authenticated reads)
CREATE POLICY "Media team members are viewable by everyone"
ON media_team_members
FOR SELECT
TO public  -- This includes both anon and authenticated roles
USING (true);

-- 3. Verify: Run this to test
-- SELECT * FROM media_team_members;
