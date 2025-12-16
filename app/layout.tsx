import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "함께 성경 | Bible Together",
    description: "매일 말씀 읽기와 묵상을 함께하는 커뮤니티",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "함께 성경",
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
        <html lang="ko" className="light">
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
            <body className="font-sans antialiased bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
                {children}
            </body>
        </html>
    );
}
