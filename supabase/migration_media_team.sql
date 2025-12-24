-- Migration: Create media_team_members table
-- Run this in Supabase SQL Editor

-- 1. Create media_team_members table
CREATE TABLE IF NOT EXISTS media_team_members (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    role text NOT NULL,
    email text,
    icon_name text DEFAULT 'Users', -- Store Lucide icon name
    gradient_class text DEFAULT 'from-slate-500 to-slate-700',
    tags text[], -- Array of strings
    short_description text,
    is_leader boolean DEFAULT false,
    
    -- JSONB for flexible rich content (SOTA detail view)
    detailed_info jsonb DEFAULT '{
        "longDescription": "",
        "quote": "",
        "vision": "",
        "skills": [],
        "recentWork": [],
        "stats": { "projects": 0, "impact": "Normal" }
    }'::jsonb,

    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Enable RLS
ALTER TABLE media_team_members ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Public Read
CREATE POLICY "Media team members are viewable by everyone" 
ON media_team_members FOR SELECT USING (true);

-- Admin Management (Insert, Update, Delete)
-- Allow PASTOR and SUB_ADMIN to manage
CREATE POLICY "Admins can manage media team" 
ON media_team_members 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('PASTOR', 'SUB_ADMIN', 'LEADER') -- added LEADER just in case, or stick to PASTOR? User said "Admin only". Let's stick to strict Admin.
        -- Actually, strictly Admin usually means PASTOR/SUB_ADMIN. Let's start with just them.
        -- Re-reading request: "management is only for administrator".
    )
);

-- Fix Admin Policy to be more specific if needed
-- Drop if exists just in case
DROP POLICY IF EXISTS "Admins can manage media team" ON media_team_members;

CREATE POLICY "Admins can insert media team" 
ON media_team_members 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('PASTOR', 'SUB_ADMIN') 
    )
);

CREATE POLICY "Admins can update media team" 
ON media_team_members 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('PASTOR', 'SUB_ADMIN') 
    )
);

CREATE POLICY "Admins can delete media team" 
ON media_team_members 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('PASTOR', 'SUB_ADMIN') 
    )
);

-- 4. Create Indexes
CREATE INDEX IF NOT EXISTS idx_media_team_leader ON media_team_members(is_leader);
