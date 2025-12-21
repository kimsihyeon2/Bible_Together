import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { BibleProvider } from "@/lib/bible-context";
import { LoadingProvider } from "@/lib/loading-context";
import { GlobalLoader } from "@/components/GlobalLoader";
import { AudioProvider } from "@/lib/audio-context";
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

export const metadata: Metadata = {
    title: "그린 바이블 | Green Bible",
    description: "매일 말씀 읽기와 묵상을 함께하는 커뮤니티",
    manifest: "/manifest.json",
    icons: {
        // iOS cache-buster: Change this version when icon changes
        apple: [
            { url: "/apple-icon.png?v=2", sizes: "180x180", type: "image/png" },
        ],
        icon: [
            { url: "/icons/icon-192x192.png?v=2", sizes: "192x192", type: "image/png" },
            { url: "/icons/icon-512x512.png?v=2", sizes: "512x512", type: "image/png" },
        ],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "그린 바이블",
    },
};

export const viewport: Viewport = {
    themeColor: "#34C759",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" className="light" suppressHydrationWarning>
            {/* ... head ... */}
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
                />
            </head>
            <body className="font-sans antialiased bg-background-light dark:bg-background-dark text-slate-900 dark:text-white" suppressHydrationWarning>
                <AuthProvider>
                    <BibleProvider>
                        <LoadingProvider>
                            <AudioProvider>
                                <GlobalLoader>
                                    {children}
                                </GlobalLoader>
                                <GlobalAudioPlayer />
                                <PushNotificationManager />
                                <PWAInstallPrompt />
                            </AudioProvider>
                        </LoadingProvider>
                    </BibleProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
