'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';

interface UsePushNotificationsReturn {
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
    const { user } = useAuth();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-subscribe when user logs in
    useEffect(() => {
        if (user && typeof window !== 'undefined') {
            // Check if already subscribed
            const isAlreadySubscribed = localStorage.getItem('push_subscribed') === 'true';
            if (isAlreadySubscribed) {
                setIsSubscribed(true);
            } else {
                // Auto-subscribe if not yet subscribed
                subscribe();
            }

            // Listen for foreground messages
            const unsubscribe = onForegroundMessage((payload) => {
                // Show notification toast for foreground messages
                if (payload.notification) {
                    showNotificationToast(payload.notification.title, payload.notification.body);
                }
            });

            return () => unsubscribe();
        }
    }, [user]);

    const subscribe = useCallback(async (): Promise<boolean> => {
        if (!user) {
            setError('로그인이 필요합니다.');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Request permission and get FCM token
            const fcmToken = await requestNotificationPermission();

            if (!fcmToken) {
                setError('알림 권한이 거부되었습니다.');
                setIsLoading(false);
                return false;
            }

            // Register token with backend
            const response = await fetch('/api/register-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    fcmToken,
                    deviceInfo: navigator.userAgent.substring(0, 100),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to register push subscription');
            }

            localStorage.setItem('push_subscribed', 'true');
            localStorage.setItem('fcm_token', fcmToken);
            setIsSubscribed(true);
            setIsLoading(false);
            return true;

        } catch (err) {
            console.error('Push subscription error:', err);
            setError('푸시 알림 등록에 실패했습니다.');
            setIsLoading(false);
            return false;
        }
    }, [user]);

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        setIsLoading(true);

        try {
            const fcmToken = localStorage.getItem('fcm_token');
            if (fcmToken) {
                await fetch(`/api/register-push?token=${encodeURIComponent(fcmToken)}`, {
                    method: 'DELETE',
                });
            }

            localStorage.removeItem('push_subscribed');
            localStorage.removeItem('fcm_token');
            setIsSubscribed(false);
            setIsLoading(false);
            return true;

        } catch (err) {
            console.error('Push unsubscription error:', err);
            setIsLoading(false);
            return false;
        }
    }, []);

    return {
        isSubscribed,
        isLoading,
        error,
        subscribe,
        unsubscribe,
    };
}

// Helper to show in-app notification toast
function showNotificationToast(title?: string, body?: string) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-4 right-4 z-[100] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 border border-slate-200 dark:border-slate-700 animate-slide-down';
    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                <span class="material-symbols-outlined">campaign</span>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-slate-900 dark:text-white text-sm">${title || '알림'}</h4>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-0.5">${body || ''}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-slate-400 hover:text-slate-600">
                <span class="material-symbols-outlined text-xl">close</span>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}
