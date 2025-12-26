import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// POST: Create urgent prayer and optionally send push notification
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content, requesterName, userId, targetRole = 'ALL' } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Check if user has PASTOR role (admin) or SUB_ADMIN - optional check
        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            const isAuthorized = profile?.role === 'PASTOR' || profile?.role === 'SUB_ADMIN';
            if (!isAuthorized) {
                return NextResponse.json(
                    { error: 'Unauthorized: Only PASTOR or SUB_ADMIN can send urgent prayers' },
                    { status: 403 }
                );
            }
        }

        // Save urgent prayer to database
        const { data: prayer, error: prayerError } = await supabase
            .from('urgent_prayers')
            .insert({
                title,
                content,
                requester_name: requesterName,
                created_by: userId,
                is_active: true,
                // store target if schema supported it, but unrelated for now
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

        // Create notification record (optional - don't fail if table doesn't exist)
        try {
            await supabase.from('notifications').insert({
                title: `🙏 긴급 기도 요청: ${title}`,
                body: content,
                target: targetRole,
                created_by: userId,
                data: { prayer_id: prayer.id, type: 'URGENT_PRAYER' }
            });
        } catch (notifError) {
            console.log('Notification table may not exist, skipping:', notifError);
        }

        // Try to send push notifications if Firebase Admin is configured
        let pushResult = { successCount: 0, failureCount: 0, total: 0 };

        try {
            // Check if push_subscriptions table exists and has tokens
            // JOIN with profiles to filter by role
            let query = supabase
                .from('push_subscriptions')
                .select('user_id, fcm_token, profiles!inner(role)')
                .eq('is_active', true);

            // Filter by target role
            if (targetRole === 'LEADER') {
                query = query.eq('profiles.role', 'LEADER');
            } else if (targetRole === 'SUB_ADMIN') {
                query = query.eq('profiles.role', 'SUB_ADMIN');
            }

            // Exclude sender
            if (userId) {
                query = query.neq('user_id', userId);
            }

            const { data: subscriptions, error: subsError } = await query;

            if (!subsError && subscriptions && subscriptions.length > 0) {
                // Only try Firebase if we have tokens
                const { sendPushNotification } = await import('@/lib/firebase-admin');

                // Deduplicate: Keep only 1 token per user to prevent multiple notifications
                // Group by user_id and take the first token for each user
                const tokensByUser = new Map<string, string>();
                subscriptions.forEach((s: { user_id: string; fcm_token: string }) => {
                    if (s.fcm_token && !tokensByUser.has(s.user_id)) {
                        tokensByUser.set(s.user_id, s.fcm_token);
                    }
                });

                const tokens = Array.from(tokensByUser.values());

                if (tokens.length > 0) {
                    const result = await sendPushNotification(
                        tokens,
                        `🙏 긴급 기도: ${title}`,
                        content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                        { type: 'urgent_prayer', prayerId: prayer.id }
                    );

                    pushResult = {
                        successCount: result.successCount,
                        failureCount: result.failureCount,
                        total: tokens.length,
                    };

                    // Deactivate failed tokens
                    if (result.failedTokens.length > 0) {
                        await supabase
                            .from('push_subscriptions')
                            .update({ is_active: false })
                            .in('fcm_token', result.failedTokens);
                    }
                }
            }
        } catch (pushError) {
            // Firebase Admin not configured or push failed - that's OK
            console.log('Push notification skipped (Firebase not configured):', pushError);
        }

        return NextResponse.json({
            success: true,
            prayer,
            push: pushResult,
            message: pushResult.successCount > 0
                ? `기도 요청이 저장되었습니다. ${pushResult.successCount}명에게 알림을 전송했습니다.`
                : '기도 요청이 저장되었습니다.',
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
