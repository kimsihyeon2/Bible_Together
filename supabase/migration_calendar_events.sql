-- Migration: Calendar Events Table
-- Hierarchical church calendar with scope-based visibility

-- 1. Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    event_time time,
    end_time time,
    location text,
    
    -- Scope: GLOBAL (all), PARISH (교구), CELL (셀)
    scope text NOT NULL DEFAULT 'CELL' CHECK (scope IN ('GLOBAL', 'PARISH', 'CELL')),
    
    -- Hierarchical references (NULL based on scope)
    parish_id uuid REFERENCES parishes(id) ON DELETE CASCADE,
    cell_id uuid REFERENCES cells(id) ON DELETE CASCADE,
    
    -- Creator info
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- SELECT: Users can see events based on their membership
CREATE POLICY "Users can view calendar events based on scope"
ON calendar_events FOR SELECT
USING (
    -- GLOBAL events: everyone can see
    scope = 'GLOBAL'
    OR
    -- PARISH events: users in the same parish
    (scope = 'PARISH' AND parish_id IN (
        SELECT c.parish_id FROM cells c
        JOIN cell_members cm ON cm.cell_id = c.id
        WHERE cm.user_id = auth.uid()
    ))
    OR
    -- CELL events: users in the same cell
    (scope = 'CELL' AND cell_id IN (
        SELECT cell_id FROM cell_members WHERE user_id = auth.uid()
    ))
);

-- INSERT: Based on role
CREATE POLICY "Users can create events based on role"
ON calendar_events FOR INSERT
WITH CHECK (
    -- Admins can create GLOBAL events
    (scope = 'GLOBAL' AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('PASTOR', 'SUB_ADMIN')
    ))
    OR
    -- Parish leaders can create PARISH events for their parish
    (scope = 'PARISH' AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('PASTOR', 'SUB_ADMIN', 'LEADER')
    ))
    OR
    -- Cell leaders can create CELL events for their cell
    (scope = 'CELL' AND EXISTS (
        SELECT 1 FROM cell_members cm
        JOIN profiles p ON p.id = cm.user_id
        WHERE cm.user_id = auth.uid() 
        AND cm.cell_id = calendar_events.cell_id
        AND p.role IN ('PASTOR', 'SUB_ADMIN', 'LEADER')
    ))
);

-- UPDATE: Creator or admin
CREATE POLICY "Users can update their own events"
ON calendar_events FOR UPDATE
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('PASTOR', 'SUB_ADMIN')
    )
);

-- DELETE: Creator or admin
CREATE POLICY "Users can delete their own events"
ON calendar_events FOR DELETE
USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('PASTOR', 'SUB_ADMIN')
    )
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_scope ON calendar_events(scope);
CREATE INDEX IF NOT EXISTS idx_calendar_events_parish ON calendar_events(parish_id) WHERE parish_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_cell ON calendar_events(cell_id) WHERE cell_id IS NOT NULL;
