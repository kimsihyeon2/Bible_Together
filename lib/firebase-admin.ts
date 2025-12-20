import admin from 'firebase-admin';

// Flag to track if Firebase Admin is properly initialized
let isInitialized = false;

// Initialize Firebase Admin SDK (only once)
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        isInitialized = true;
        return true;
    }

    try {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountKey) {
            console.warn('⚠️ Firebase Admin: FIREBASE_SERVICE_ACCOUNT_KEY not set in environment variables');
            console.warn('   Push notifications will NOT work until this is configured in Vercel.');
            console.warn('   Get your service account key from: Firebase Console > Project Settings > Service Accounts');
            return false;
        }

        const serviceAccount = JSON.parse(serviceAccountKey);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        isInitialized = true;
        console.log('✅ Firebase Admin initialized successfully - Push notifications enabled');
        return true;
    } catch (error) {
        console.error('❌ Firebase Admin initialization failed:', error);
        console.error('   Check that FIREBASE_SERVICE_ACCOUNT_KEY is valid JSON');
        return false;
    }
}

// Try to initialize on module load
initializeFirebaseAdmin();

export const firebaseAdmin = admin;

// Send push notification to multiple tokens
export async function sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
    // Check if Firebase is initialized
    if (!isInitialized) {
        console.log('Firebase Admin not initialized, skipping push');
        return { successCount: 0, failureCount: 0, failedTokens: [] };
    }

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
        return { successCount: 0, failureCount: 0, failedTokens: [] };
    }
}

// Send to single token
export async function sendPushToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
): Promise<boolean> {
    if (!isInitialized) {
        return false;
    }

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
