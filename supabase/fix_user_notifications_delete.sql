-- Fix: Add DELETE policy for user_notifications
-- Issue: Users cannot delete their own notifications because DELETE policy is missing

-- Add DELETE policy
CREATE POLICY "Users can delete own notifications"
    ON user_notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Verify existing policies by running:
-- SELECT * FROM pg_policies WHERE tablename = 'user_notifications';
