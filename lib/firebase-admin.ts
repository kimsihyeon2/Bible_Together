import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (only once)
if (!admin.apps.length) {
    try {
        // Option 1: Use service account JSON from env
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : null;

        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } else {
            // Option 2: Use default credentials (for Google Cloud environments)
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        }
        console.log('Firebase Admin initialized');
    } catch (error) {
        console.error('Firebase Admin initialization error:', error);
    }
}

export const firebaseAdmin = admin;

// Send push notification to multiple tokens
export async function sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
    if (!tokens.length) {
        return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    // Filter out empty tokens
    const validTokens = tokens.filter(t => t && t.length > 0);
    if (!validTokens.length) {
        return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

    const message: admin.messaging.MulticastMessage = {
        notification: {
            title,
            body,
        },
        data: data || {},
        tokens: validTokens,
        android: {
            priority: 'high',
            notification: {
                channelId: 'urgent_prayers',
                priority: 'max',
                defaultSound: true,
                defaultVibrateTimings: true,
            },
        },
        apns: {
            payload: {
                aps: {
                    alert: { title, body },
                    sound: 'default',
                    badge: 1,
                },
            },
        },
        webpush: {
            notification: {
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [100, 50, 100],
                requireInteraction: true,
            },
            fcmOptions: {
                link: '/',
            },
        },
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);

        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(validTokens[idx]);
                console.error(`Failed to send to token ${idx}:`, resp.error);
            }
        });

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            failedTokens,
        };
    } catch (error) {
        console.error('Error sending push notification:', error);
        throw error;
    }
}

// Send to single token
export async function sendPushToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> {
    try {
        await admin.messaging().send({
            token,
            notification: { title, body },
            data,
            webpush: {
                notification: {
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-72x72.png',
                },
            },
        });
        return true;
    } catch (error) {
        console.error('Error sending push to token:', error);
        return false;
    }
}
