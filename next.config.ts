import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    register: true,
    disable: process.env.NODE_ENV === "development",
    // Disabled aggressive caching to prevent old UI from appearing
    cacheOnFrontEndNav: false,
    aggressiveFrontEndNavCaching: false,
    reloadOnOnline: true,
    workboxOptions: {
        disableDevLogs: true,
        skipWaiting: true,
        clientsClaim: true,
        // Limit runtime caching to avoid stale content
        runtimeCaching: [
            {
                urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
                handler: 'NetworkFirst',
                options: {
                    cacheName: 'supabase-api',
                    expiration: {
                        maxEntries: 50,
                        maxAgeSeconds: 60 * 5, // 5 minutes
                    },
                },
            },
        ],
    },
});

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // Disable ESLint during builds due to circular reference bug in eslint-config-next
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
    // Force no-cache headers for HTML pages in development
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-store, must-revalidate',
                    },
                ],
            },
        ];
    },
};

export default withPWA(nextConfig);
