// Firebase Cloud Messaging Service Worker
// This file MUST be in the public folder for FCM to work

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config - Update these values from your Firebase console
firebase.initializeApp({
    apiKey: "AIzaSyBA08-UuNplZ4NlJ7qpwpTnS8hEt-NruBw",
    authDomain: "bibletogether-1e7f0.firebaseapp.com",
    projectId: "bibletogether-1e7f0",
    storageBucket: "bibletogether-1e7f0.firebasestorage.app",
    messagingSenderId: "304405263354",
    appId: "1:304405263354:web:aaf254394d99aef3836a43"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || '함께 성경';
    const notificationOptions = {
        body: payload.notification?.body || '새로운 알림이 있습니다.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: payload.data,
        actions: [
            { action: 'open', title: '열기' },
            { action: 'close', title: '닫기' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event.action);
    event.notification.close();

    if (event.action === 'close') return;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
