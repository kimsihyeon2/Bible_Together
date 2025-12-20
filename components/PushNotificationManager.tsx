'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UrgentAlertOverlay } from './UrgentAlertOverlay';

// Component that handles automatic push notification registration
// NOW: Immediately prompts for permission when user logs in
export function PushNotificationManager() {
    const { user } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        // Check immediately if we need to show the prompt
        checkAndPrompt();
        setupForegroundListener();
    }, [user]);

    const checkAndPrompt = async () => {
        // Check if already registered
        const isRegistered = localStorage.getItem('push_registered') === 'true';
        if (isRegistered) {
            console.log('✅ Push already registered');
            return;
        }

        // Check if notifications are supported
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            console.log('Push notifications not supported');
            return;
        }

        // Check current permission status
        const permission = Notification.permission;

        if (permission === 'denied') {
            console.log('Push permission denied by user');
            // Don't show prompt if already denied
            return;
        }

        if (permission === 'default') {
            // Never asked - show the prompt modal immediately!
            setShowPrompt(true);
        } else if (permission === 'granted') {
            // Permission granted but not registered - try to register
            await registerPushToken();
        }
    };

    const registerPushToken = async () => {
        setIsRegistering(true);
        try {
            const { requestNotificationPermission } = await import('@/lib/firebase');

            const tokenPromise = requestNotificationPermission();
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('FCM token request timeout')), 15000)
            );

            const fcmToken = await Promise.race([tokenPromise, timeoutPromise]);

            if (fcmToken) {
                const response = await fetch('/api/register-push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user?.id,
                        fcmToken,
                        deviceInfo: navigator.userAgent.substring(0, 100),
                    }),
                });

                if (response.ok) {
                    localStorage.setItem('push_registered', 'true');
                    localStorage.setItem('fcm_token', fcmToken);
                    console.log('✅ Push notifications registered successfully!');
                }
            }
        } catch (error) {
            console.error('Push registration failed:', error);
        } finally {
            setIsRegistering(false);
            setShowPrompt(false);
        }
    };

    const handleAllowNotifications = async () => {
        await registerPushToken();
    };

    const handleDenyNotifications = () => {
        // User clicked "나중에" - don't show again for this session
        localStorage.setItem('push_prompt_dismissed', Date.now().toString());
        setShowPrompt(false);
    };

    const setupForegroundListener = async () => {
        try {
            const { onForegroundMessage } = await import('@/lib/firebase');
            onForegroundMessage((payload: any) => {
                console.log('Foreground message:', payload);

                const isUrgent = payload.data?.type === 'urgent_prayer' ||
                    payload.data?.type === 'URGENT_PRAYER' ||
                    payload.notification?.title?.includes('긴급');

                if (isUrgent && (window as any).triggerUrgentAlert) {
                    (window as any).triggerUrgentAlert(payload);
                    return;
                }

                if (payload.notification) {
                    showInAppNotification(
                        payload.notification.title || '알림',
                        payload.notification.body || ''
                    );
                }
            });
        } catch (e) {
            console.error('Foreground listener setup failed', e);
        }
    };

    return (
        <>
            <UrgentAlertOverlay />

            {/* Push Permission Prompt Modal */}
            {showPrompt && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-scaleUp">
                        {/* Header with bell animation */}
                        <div className="bg-gradient-to-br from-primary to-green-500 p-8 text-center">
                            <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                                <span className="text-5xl">🔔</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white">알림을 켜주세요!</h2>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="text-center text-slate-600 dark:text-slate-300 mb-2">
                                <strong className="text-primary">긴급 기도 요청</strong>이 올라오면
                            </p>
                            <p className="text-center text-slate-600 dark:text-slate-300 mb-6">
                                바로 알림을 받을 수 있어요 🙏
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleAllowNotifications}
                                    disabled={isRegistering}
                                    className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold text-lg shadow-lg shadow-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isRegistering ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            등록 중...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">notifications_active</span>
                                            알림 허용하기
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDenyNotifications}
                                    className="w-full py-3 text-slate-400 hover:text-slate-600 transition-colors text-sm"
                                >
                                    나중에 할게요
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Show in-app notification toast
function showInAppNotification(title: string, body: string) {
    if (typeof document === 'undefined') return;

    const toast = document.createElement('div');
    toast.id = 'push-notification-toast';
    toast.style.cssText = `
        position: fixed; top: 16px; left: 16px; right: 16px; z-index: 9999;
        background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        padding: 16px; display: flex; align-items: flex-start; gap: 12px;
        animation: slideDown 0.3s ease-out;
    `;
    toast.innerHTML = `
        <div style="width: 40px; height: 40px; border-radius: 50%; background: #FEE2E2; display: flex; align-items: center; justify-content: center;">🙏</div>
        <div style="flex: 1;"><h4 style="font-weight: bold; color: #1F2937; font-size: 14px; margin: 0 0 4px 0;">${title}</h4><p style="color: #6B7280; font-size: 13px; margin: 0;">${body}</p></div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #9CA3AF; cursor: pointer;">✕</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
}
