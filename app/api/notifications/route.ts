
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
    const supabase = createServerSupabaseClient();

    // Attempt to get user_id from query params since we don't have automatic cookie-based auth in this simple client
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (userId) {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ notifications: notifications || [] });
    }

    // If no user_id provided, return empty list to verify endpoint existence (200 OK)
    // This resolves the 404 error without exposing sensitive data.
    return NextResponse.json({ notifications: [] });
}
