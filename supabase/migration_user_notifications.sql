-- Migration: Add user_notifications table for tracking read/unread status
-- This allows each user to have their own read status for each notification

-- Create user_notifications junction table
CREATE TABLE IF NOT EXISTS user_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    notification_id uuid NOT NULL,
    prayer_id uuid, -- Reference to urgent_prayer if applicable
    title text NOT NULL,
    body text,
    type text DEFAULT 'general', -- 'urgent_prayer', 'announcement', 'reminder', etc.
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    read_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications" 
    ON user_notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON user_notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" 
    ON user_notifications FOR INSERT 
    WITH CHECK (true);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_user 
    ON user_notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_notifications_unread 
    ON user_notifications(user_id) 
    WHERE is_read = false;

-- Function to create notifications for all users when urgent prayer is created
CREATE OR REPLACE FUNCTION create_urgent_prayer_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a notification for each user
    INSERT INTO user_notifications (user_id, notification_id, prayer_id, title, body, type)
    SELECT 
        p.id,
        gen_random_uuid(),
        NEW.id,
        '🙏 긴급 기도: ' || NEW.title,
        SUBSTRING(NEW.content, 1, 100),
        'urgent_prayer'
    FROM profiles p;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create notifications
DROP TRIGGER IF EXISTS on_urgent_prayer_created ON urgent_prayers;
CREATE TRIGGER on_urgent_prayer_created
    AFTER INSERT ON urgent_prayers
    FOR EACH ROW
    EXECUTE FUNCTION create_urgent_prayer_notifications();
