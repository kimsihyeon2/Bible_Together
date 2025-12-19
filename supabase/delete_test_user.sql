-- Force delete test user to allow clean signup
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'testuser@example.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Delete from public tables first (cascade should handle this but let's be safe)
        DELETE FROM public.cell_members WHERE user_id = v_user_id;
        DELETE FROM public.users WHERE id = v_user_id;
        
        -- Delete from auth table
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE 'Deleted user testuser@example.com';
    ELSE
        RAISE NOTICE 'User testuser@example.com not found';
    END IF;
END $$;
