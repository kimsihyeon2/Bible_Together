import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// POST: Register/Update FCM token for push notifications
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, fcmToken, deviceInfo } = body;

        if (!userId || !fcmToken) {
            return NextResponse.json(
                { error: 'userId and fcmToken are required' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        // Upsert the subscription (insert or update if token exists)
        const { data, error } = await supabase
            .from('push_subscriptions')
            .upsert(
                {
                    user_id: userId,
                    fcm_token: fcmToken,
                    device_info: deviceInfo || 'Web Browser',
                    is_active: true,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'fcm_token',
                }
            )
            .select()
            .single();

        if (error) {
            console.error('Error saving push subscription:', error);
            return NextResponse.json(
                { error: 'Failed to save subscription', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: '푸시 알림이 활성화되었습니다.',
            subscription: data,
        });

    } catch (error) {
        console.error('Error in register-push API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fcmToken = searchParams.get('token');

        if (!fcmToken) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        const supabase = createServerSupabaseClient();

        await supabase
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('fcm_token', fcmToken);

        return NextResponse.json({
            success: true,
            message: '푸시 알림이 비활성화되었습니다.',
        });

    } catch (error) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
