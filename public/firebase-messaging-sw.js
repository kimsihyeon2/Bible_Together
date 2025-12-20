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

    // browser will handle the notification display automatically because we are sending "notification" payload
    // calling showNotification here causes a duplicate notification

    // If we wanted to handle data-only messages, we would check for payload.notification being undefined
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
