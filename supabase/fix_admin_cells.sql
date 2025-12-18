-- =============================================
-- Admin Mode Fix: Cells Table Permissions
-- =============================================

-- Ensure RLS is enabled
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;

-- 1. Grant INSERT permission to PASTORS
DROP POLICY IF EXISTS "Pastors can insert cells" ON cells;
CREATE POLICY "Pastors can insert cells"
ON cells FOR INSERT
TO authenticated
WITH CHECK (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'PASTOR'
  )
);

-- 2. Grant DELETE permission to PASTORS
DROP POLICY IF EXISTS "Pastors can delete cells" ON cells;
CREATE POLICY "Pastors can delete cells"
ON cells FOR DELETE
TO authenticated
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'PASTOR'
  )
);

-- 3. Grant UPDATE permission to PASTORS
DROP POLICY IF EXISTS "Pastors can update cells" ON cells;
CREATE POLICY "Pastors can update cells"
ON cells FOR UPDATE
TO authenticated
USING (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'PASTOR'
  )
);

-- 4. Verification (Optional, for logging)
-- Select verified policies
SELECT tablename, policyname, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'cells';
