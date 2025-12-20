-- Migration: Allow admins to manage member profiles (update role, delete members)
-- Run this in Supabase SQL Editor

-- Drop existing profile update/delete policies if they exist
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- Allow PASTOR (Admin) to update any profile's role
CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE
    USING (
        -- User is PASTOR (full admin)
        EXISTS (
            SELECT 1 FROM profiles AS admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'PASTOR'
        )
        OR
        -- User is updating their own profile (except role field is handled by trigger if needed)
        id = auth.uid()
    );

-- Allow PASTOR to delete any profile (except self - handled in app logic)
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE
    USING (
        -- Only PASTOR can delete
        EXISTS (
            SELECT 1 FROM profiles AS admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'PASTOR'
        )
        AND
        -- Cannot delete self (safety check at DB level too)
        id != auth.uid()
    );

-- Allow SUB_ADMIN to update MEMBER/LEADER roles
CREATE POLICY "SubAdmins can update member roles" ON profiles
    FOR UPDATE
    USING (
        -- User is SUB_ADMIN
        EXISTS (
            SELECT 1 FROM profiles AS admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'SUB_ADMIN'
        )
        AND
        -- Target is MEMBER or LEADER (not admin roles)
        role IN ('MEMBER', 'LEADER')
    );

-- Allow SUB_ADMIN to delete MEMBER/LEADER
CREATE POLICY "SubAdmins can delete members" ON profiles
    FOR DELETE
    USING (
        -- User is SUB_ADMIN
        EXISTS (
            SELECT 1 FROM profiles AS admin_profile 
            WHERE admin_profile.id = auth.uid() 
            AND admin_profile.role = 'SUB_ADMIN'
        )
        AND
        -- Target is MEMBER or LEADER only
        role IN ('MEMBER', 'LEADER')
        AND
        -- Cannot delete self
        id != auth.uid()
    );
