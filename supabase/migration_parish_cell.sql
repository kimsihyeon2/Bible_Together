-- =============================================
-- Migration: Parish -> Cell Hierarchy
-- =============================================

-- 1. Rename existing 'cells' to 'parishes'
ALTER TABLE cells RENAME TO parishes;

-- 2. Create NEW 'cells' table (Small Groups)
CREATE TABLE IF NOT EXISTS cells (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    parish_id uuid REFERENCES parishes(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text UNIQUE, -- Invite code (e.g., "JOSHUA1")
    leader_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Create Default Cells for existing Parishes (to migrate users)
-- We use a temporary function to ensure uniqueness or just UUID
INSERT INTO cells (parish_id, name, code)
SELECT 
    id, 
    '일반 셀', -- Default name
    'DEFAULT_' || substring(id::text, 1, 8) -- Temporary code
FROM parishes;

-- 4. Update 'cell_members' table
-- First, fix the Foreign Key to point to parishes (since table was renamed, constraint might surely point to table OID, but let's be safe)
-- Actually, renaming table renames references? Let's assume we need to restructure.

-- Rename the old 'cell_id' (which is now parish_id)
ALTER TABLE cell_members RENAME COLUMN cell_id TO parish_id;

-- Add new 'cell_id' column
ALTER TABLE cell_members ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE CASCADE;

-- Assign members to the "Default Cell" of their Parish
UPDATE cell_members cm
SET cell_id = c.id
FROM cells c
WHERE cm.parish_id = c.parish_id;

-- Constraint Updates
ALTER TABLE cell_members ALTER COLUMN cell_id SET NOT NULL;
ALTER TABLE cell_members DROP CONSTRAINT IF EXISTS cell_members_pkey;
ALTER TABLE cell_members ADD PRIMARY KEY (cell_id, user_id);

-- Explicit FK for parish_id (it should still point to parishes table OID, but let's ensure naming)
-- ALTER TABLE cell_members DROP CONSTRAINT IF EXISTS cell_members_cell_id_fkey; -- The old name
-- ALTER TABLE cell_members ADD CONSTRAINT cell_members_parish_id_fkey FOREIGN KEY (parish_id) REFERENCES parishes(id) ON DELETE CASCADE;


-- 5. Update 'reading_activities'
ALTER TABLE reading_activities RENAME COLUMN cell_id TO parish_id;
ALTER TABLE reading_activities ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE SET NULL;

UPDATE reading_activities ra
SET cell_id = c.id
FROM cells c
WHERE ra.parish_id = c.parish_id;


-- 6. Update 'messages'
ALTER TABLE messages RENAME COLUMN cell_id TO parish_id;
ALTER TABLE messages ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE CASCADE;

UPDATE messages m
SET cell_id = c.id
FROM cells c
WHERE m.parish_id = c.parish_id;

-- 7. RLS Policies

-- [Parishes]
ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;

-- Everyone can view Parishes (for selection)
DROP POLICY IF EXISTS "Parishes are viewable by everyone" ON parishes;
CREATE POLICY "Parishes are viewable by everyone" ON parishes FOR SELECT USING (true);

-- Only Pastors can Manage Parishes
DROP POLICY IF EXISTS "Pastors can insert parishes" ON parishes;
CREATE POLICY "Pastors can insert parishes" ON parishes FOR INSERT TO authenticated
WITH CHECK (exists (select 1 from profiles where id = auth.uid() and role = 'PASTOR'));

DROP POLICY IF EXISTS "Pastors can update parishes" ON parishes;
CREATE POLICY "Pastors can update parishes" ON parishes FOR UPDATE TO authenticated
USING (exists (select 1 from profiles where id = auth.uid() and role = 'PASTOR'));

DROP POLICY IF EXISTS "Pastors can delete parishes" ON parishes;
CREATE POLICY "Pastors can delete parishes" ON parishes FOR DELETE TO authenticated
USING (exists (select 1 from profiles where id = auth.uid() and role = 'PASTOR'));


-- [Cells]
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;

-- Authenticated can view cells (to join) - Or maybe restricted?
-- User needs to find cell by code. 
DROP POLICY IF EXISTS "Cells are viewable by everyone" ON cells;
CREATE POLICY "Cells are viewable by everyone" ON cells FOR SELECT USING (true);

-- Pastors can Manage Cells
DROP POLICY IF EXISTS "Pastors can manage cells" ON cells;
CREATE POLICY "Pastors can manage cells" ON cells FOR ALL TO authenticated
USING (exists (select 1 from profiles where id = auth.uid() and role = 'PASTOR'));

-- Leaders can Manage their own Cells? (Future)


-- [Cell Members]
-- Update policies to reflect new structure
DROP POLICY IF EXISTS "Cell members are viewable by everyone" ON cell_members;
CREATE POLICY "Cell members are viewable by everyone" ON cell_members FOR SELECT USING (true);

-- "Users can join cells" needs to check limits?
DROP POLICY IF EXISTS "Users can join cells" ON cell_members;
CREATE POLICY "Users can join cells" ON cell_members FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- [Notifications]
-- 'target' now can be 'PARISH', 'CELL', 'LEADER'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_target_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_target_check CHECK (target IN ('ALL', 'LEADER', 'PARISH', 'CELL'));
ALTER TABLE notifications RENAME COLUMN cell_id TO parish_id; -- Notifications were mostly parish level?
ALTER TABLE notifications ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE CASCADE;

