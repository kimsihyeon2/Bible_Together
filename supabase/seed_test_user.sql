-- =============================================
-- SEED DATA: Test User for Automated Testing
-- =============================================
-- 
-- NOTE: This script creates a TEST USER for automated testing purposes.
-- You need to run this in Supabase SQL Editor.
-- 
-- IMPORTANT: Since Supabase auth.users is managed by the Auth service,
-- we cannot directly insert into it via SQL. Instead, you should:
-- 
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run this script completely.
-- 3. It will DELETE the existing 'testuser@example.com' if it exists.
-- 4. Then follow the manual steps below to recreate it.

-- =============================================
-- PART 1: CLEANUP (Auto-run)
-- =============================================
DO $$
DECLARE
    v_old_user_id uuid;
BEGIN
    SELECT id INTO v_old_user_id FROM auth.users WHERE email = 'testuser@example.com';
    IF v_old_user_id IS NOT NULL THEN
        -- Delete from dependent tables first
        DELETE FROM public.cell_members WHERE user_id = v_old_user_id;
        DELETE FROM public.profiles WHERE id = v_old_user_id;
        
        -- Finally delete from auth.users
        DELETE FROM auth.users WHERE id = v_old_user_id;
        RAISE NOTICE 'Cleaned up old test user';
    END IF;
END $$;

-- =============================================
-- PART 2: MANUAL CREATION REQURIED
-- =============================================
-- IMPORTANT: Since Supabase auth.users is managed by the Auth service,
-- we cannot directly insert into it via SQL. Please:
-- 
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" > "Create new user"
-- 3. Enter credentials:
--    - Email: testuser@example.com
--    - Password: TestPass123!
-- 
-- 4. THEN Run PART 3 (Select text below and run)

-- =============================================
-- PART 3: ASSIGN TO CELL
-- =============================================
-- 

DO $$
DECLARE
    v_test_user_id uuid;
    v_first_cell_id uuid;
    v_first_parish_id uuid;
BEGIN
    -- Get the test user ID (replace with actual user ID after creation)
    SELECT id INTO v_test_user_id FROM auth.users WHERE email = 'testuser@bibletogether.com' LIMIT 1;
    
    IF v_test_user_id IS NOT NULL THEN
        -- Get first parish
        SELECT id INTO v_first_parish_id FROM parishes LIMIT 1;
        
        -- Get first cell in that parish (or any cell)
        SELECT id INTO v_first_cell_id FROM cells WHERE parish_id = v_first_parish_id LIMIT 1;
        IF v_first_cell_id IS NULL THEN
            SELECT id INTO v_first_cell_id FROM cells LIMIT 1;
        END IF;
        
        -- Add user to cell_members if not already there
        IF v_first_cell_id IS NOT NULL THEN
            INSERT INTO cell_members (parish_id, cell_id, user_id)
            VALUES (v_first_parish_id, v_first_cell_id, v_test_user_id)
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Test user added to cell successfully!';
        ELSE
            RAISE NOTICE 'No cells found. Please run seed_dummy_cells.sql first.';
        END IF;
    ELSE
        RAISE NOTICE 'Test user not found. Please create the user in Supabase Auth first.';
    END IF;
END $$;
