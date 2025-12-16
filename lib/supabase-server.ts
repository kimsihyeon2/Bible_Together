import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createServerSupabaseClient() {
    return createClient(supabaseUrl, supabaseAnonKey);
}
