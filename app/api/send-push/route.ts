import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// POST: Create urgent prayer and send notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content, requesterName, userId } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Check if user has PASTOR role (admin) - optional
        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (profile?.role !== 'PASTOR') {
                return NextResponse.json(
                    { error: 'Unauthorized: Only PASTOR can send urgent prayers' },
                    { status: 403 }
                );
            }
        }

        // Save urgent prayer
        const { data: prayer, error: prayerError } = await supabase
            .from('urgent_prayers')
            .insert({
                title,
                content,
                requester_name: requesterName,
                created_by: userId,
                is_active: true,
            })
            .select()
            .single();

        if (prayerError) {
            console.error('Error saving prayer:', prayerError);
            return NextResponse.json(
                { error: 'Failed to save prayer request', details: prayerError.message },
                { status: 500 }
            );
        }

        // Create notification
        await supabase.from('notifications').insert({
            title: `🙏 긴급 기도 요청: ${title}`,
            body: content,
            target: 'ALL',
            created_by: userId,
        });

        // Get FCM tokens for push notifications
        const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('fcm_token')
            .eq('is_active', true);

        return NextResponse.json({
            success: true,
            prayer,
            message: `Prayer saved. ${subscriptions?.length || 0} devices will receive notification.`,
        });

    } catch (error) {
        console.error('Error in send-push API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET: List recent urgent prayers
export async function GET() {
    try {
        const supabase = createServerSupabaseClient();

        const { data: prayers, error } = await supabase
            .from('urgent_prayers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ prayers });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
