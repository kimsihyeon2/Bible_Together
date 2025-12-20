'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';

// Component that handles automatic push notification registration
export function PushNotificationManager() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        let unsubscribeForeground: (() => void) | undefined;

        const setupPushNotifications = async () => {
            try {
                // Check if already registered
                const isRegistered = localStorage.getItem('push_registered') === 'true';

                if (!isRegistered) {
                    // Ask for permission and get token
                    const fcmToken = await requestNotificationPermission();

                    if (fcmToken) {
                        // Register token with backend
                        const response = await fetch('/api/register-push', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: user.id,
                                fcmToken,
                                deviceInfo: `${navigator.userAgent.substring(0, 50)}`,
                            }),
                        });

                        if (response.ok) {
                            localStorage.setItem('push_registered', 'true');
                            localStorage.setItem('fcm_token', fcmToken);
                            console.log('✅ Push notifications registered successfully');
                        }
                    }
                }

                // Listen for foreground messages
                unsubscribeForeground = onForegroundMessage((payload) => {
                    console.log('📬 Foreground message:', payload);

                    // Show in-app notification
                    if (payload.notification) {
                        showInAppNotification(
                            payload.notification.title || '알림',
                            payload.notification.body || ''
                        );
                    }
                });

            } catch (error) {
                console.error('Push notification setup error:', error);
            }
        };

        setupPushNotifications();

        return () => {
            if (unsubscribeForeground) {
                unsubscribeForeground();
            }
        };
    }, [user]);

    return null; // This is a manager component, no UI
}

// Show in-app notification toast
function showInAppNotification(title: string, body: string) {
    // Check if we're in the browser
    if (typeof document === 'undefined') return;

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'push-notification-toast';
    toast.style.cssText = `
        position: fixed;
        top: 16px;
        left: 16px;
        right: 16px;
        z-index: 9999;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        padding: 16px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        animation: slideDown 0.3s ease-out;
    `;

    toast.innerHTML = `
        <div style="width: 40px; height: 40px; border-radius: 50%; background: #FEE2E2; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            🙏
        </div>
        <div style="flex: 1; min-width: 0;">
            <h4 style="font-weight: bold; color: #1F2937; font-size: 14px; margin: 0 0 4px 0;">${title}</h4>
            <p style="color: #6B7280; font-size: 13px; margin: 0;">${body}</p>
        </div>
        <button id="close-toast" style="background: none; border: none; color: #9CA3AF; cursor: pointer; padding: 4px;">✕</button>
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(toast);

    // Close button handler
    document.getElementById('close-toast')?.addEventListener('click', () => {
        toast.remove();
    });

    // Auto remove after 6 seconds
    setTimeout(() => {
        if (document.getElementById('push-notification-toast')) {
            toast.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 6000);
}
