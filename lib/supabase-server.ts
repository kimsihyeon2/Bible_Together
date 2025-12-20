import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for API routes
// Uses SERVICE ROLE KEY to bypass RLS (Row Level Security) policies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// Try Service Role Key first (for admin operations), fallback to Anon Key
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function createServerSupabaseClient() {
    // Use service role key if available (bypasses RLS)
    const key = supabaseServiceRoleKey || supabaseAnonKey;

    if (!supabaseServiceRoleKey) {
        console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set, using anon key (may fail on RLS-protected tables)');
    }

    return createClient(supabaseUrl, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

// For operations that specifically need admin privileges (bypasses RLS)
export function createServiceRoleClient() {
    if (!supabaseServiceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
    }

    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
