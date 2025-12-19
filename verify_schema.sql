-- =============================================
-- SYSTEM VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Verify 'cells' table Foreign Key to 'parishes'
SELECT 
    tc.table_name, kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='cells' AND kcu.column_name='parish_id';

-- 2. Check for Orphan Cell Members (Members in non-existent cells)
SELECT COUNT(*) as orphan_members_count
FROM cell_members cm
LEFT JOIN cells c ON cm.cell_id = c.id
WHERE c.id IS NULL;

-- 3. Verify 'parishes' table existence and primary key
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'parishes';

-- 4. RLS Policy Check (Metadata only)
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('cells', 'parishes');
