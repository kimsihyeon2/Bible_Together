-- Create personal_prayers table for private prayer notes
CREATE TABLE IF NOT EXISTS public.personal_prayers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'Family',
    is_answered BOOLEAN DEFAULT FALSE,
    prayer_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.personal_prayers ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Users can only see their own prayers
CREATE POLICY "Users can view their own prayers" 
ON public.personal_prayers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert their own prayers
CREATE POLICY "Users can insert their own prayers" 
ON public.personal_prayers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own prayers
CREATE POLICY "Users can update their own prayers" 
ON public.personal_prayers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own prayers
CREATE POLICY "Users can delete their own prayers" 
ON public.personal_prayers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personal_prayers_updated_at
    BEFORE UPDATE ON public.personal_prayers
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
