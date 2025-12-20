'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

// Component that handles automatic push notification registration
// Runs AFTER login completes, does NOT block the login process
export function PushNotificationManager() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        // Run push setup in background with a delay to not block login
        const timeoutId = setTimeout(() => {
            setupPushNotifications();
        }, 3000); // Wait 3 seconds after login before trying push

        return () => {
            clearTimeout(timeoutId);
        };
    }, [user]);

    const setupPushNotifications = async () => {
        try {
            // Check if already registered
            const isRegistered = localStorage.getItem('push_registered') === 'true';
            if (isRegistered) {
                console.log('Push already registered, skipping');
                setupForegroundListener();
                return;
            }

            // Check if notifications are supported
            if (!('Notification' in window) || !('serviceWorker' in navigator)) {
                console.log('Push notifications not supported');
                return;
            }

            // Dynamic import to avoid blocking
            const { requestNotificationPermission, onForegroundMessage } = await import('@/lib/firebase');

            // Add timeout to prevent endless waiting
            const tokenPromise = requestNotificationPermission();
            const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('FCM token request timeout')), 10000)
            );

            const fcmToken = await Promise.race([tokenPromise, timeoutPromise]);

            if (fcmToken) {
                // Register token with backend (non-blocking)
                fetch('/api/register-push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user?.id,
                        fcmToken,
                        deviceInfo: navigator.userAgent.substring(0, 50),
                    }),
                }).then(response => {
                    if (response.ok) {
                        localStorage.setItem('push_registered', 'true');
                        localStorage.setItem('fcm_token', fcmToken);
                        console.log('✅ Push notifications registered');
                    }
                }).catch(err => console.log('Push registration failed:', err));
            }

            setupForegroundListener();

        } catch (error) {
            console.log('Push setup skipped:', error);
        }
    };

    const setupForegroundListener = async () => {
        try {
            const { onForegroundMessage } = await import('@/lib/firebase');
            onForegroundMessage((payload) => {
                if (payload.notification) {
                    showInAppNotification(
                        payload.notification.title || '알림',
                        payload.notification.body || ''
                    );
                }
            });
        } catch (e) {
            // Ignore
        }
    };

    return null;
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
