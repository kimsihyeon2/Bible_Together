-- =============================================
-- RECOVERY MIGRATION: Parish -> Cell Hierarchy
-- (Safe to run multiple times / Idempotent)
-- =============================================

DO $$ 
BEGIN

    -- 1. Check if 'parishes' table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'parishes') THEN
        -- If not, rename 'cells' to 'parishes' (Assuming 'cells' implies the old table)
        -- But be careful if 'cells' doesn't exist either
        IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'cells') THEN
            ALTER TABLE cells RENAME TO parishes;
        END IF;
    END IF;

    -- 2. Create NEW 'cells' table if it doesn't exist
    CREATE TABLE IF NOT EXISTS cells (
        id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        parish_id uuid REFERENCES parishes(id) ON DELETE CASCADE,
        name text NOT NULL,
        code text UNIQUE,
        leader_id uuid, -- We verify reference later to avoid circular dependency issues if profiles not ready
        description text,
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
    );

    -- 2.1 Add Foreign Key to profiles if not exists
    BEGIN
        ALTER TABLE cells ADD CONSTRAINT cells_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES profiles(id) ON DELETE SET NULL;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;

    -- 3. Migrate Data: Create Default Cells for Parishes if none exist
    INSERT INTO cells (parish_id, name, code)
    SELECT id, '일반 셀', 'DEFAULT_' || substring(id::text, 1, 8)
    FROM parishes
    WHERE NOT EXISTS (SELECT 1 FROM cells WHERE cells.parish_id = parishes.id);

    -- 4. Update 'cell_members' table
    -- Check if 'parish_id' column exists, if not, rename existing 'cell_id'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cell_members' AND column_name = 'cell_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cell_members' AND column_name = 'parish_id'
    ) THEN
        ALTER TABLE cell_members RENAME COLUMN cell_id TO parish_id;
    END IF;

    -- Add new 'cell_id' column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cell_members' AND column_name = 'cell_id'
    ) THEN
        ALTER TABLE cell_members ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE CASCADE;
        
        -- Assign members to Default Cell
        UPDATE cell_members cm
        SET cell_id = c.id
        FROM cells c
        WHERE cm.parish_id = c.parish_id;
        
        -- Set Not Null (if data allows)
        -- ALTER TABLE cell_members ALTER COLUMN cell_id SET NOT NULL;
    END IF;

    -- Fix Primary Key for cell_members -> (cell_id, user_id)
    -- This is tricky in DO block, skipping for safety in recovery, but ensure index exists

    -- 5. Update 'reading_activities'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reading_activities' AND column_name = 'cell_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reading_activities' AND column_name = 'parish_id') THEN
        ALTER TABLE reading_activities RENAME COLUMN cell_id TO parish_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reading_activities' AND column_name = 'cell_id') THEN
        ALTER TABLE reading_activities ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE SET NULL;
        
        UPDATE reading_activities ra
        SET cell_id = c.id
        FROM cells c
        WHERE ra.parish_id = c.parish_id;
    END IF;

    -- 6. Update 'messages'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'cell_id')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'parish_id') THEN
        ALTER TABLE messages RENAME COLUMN cell_id TO parish_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'cell_id') THEN
        ALTER TABLE messages ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE CASCADE;
        
        UPDATE messages m
        SET cell_id = c.id
        FROM cells c
        WHERE m.parish_id = c.parish_id;
    END IF;

    -- 7. Fix Notifications 'target' column
    -- Check if 'notifications' table exists
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        -- Check if 'target' column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'target') THEN
            ALTER TABLE notifications ADD COLUMN target text DEFAULT 'ALL';
        END IF;

        -- Drop existing check constraint if any
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_target_check;
        
        -- Add updated check constraint
        ALTER TABLE notifications ADD CONSTRAINT notifications_target_check CHECK (target IN ('ALL', 'LEADER', 'PARISH', 'CELL'));
        
        -- Migration for parish_id/cell_id columns in notifications
         IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'cell_id')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'parish_id') THEN
            ALTER TABLE notifications RENAME COLUMN cell_id TO parish_id;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'cell_id') THEN
            ALTER TABLE notifications ADD COLUMN cell_id uuid REFERENCES cells(id) ON DELETE CASCADE;
        END IF;
    END IF;

END $$;
