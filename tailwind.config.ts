import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./screens/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#4CAF50", // Updated to new vivid green
                "primary-hover": "#43A047",
                "primary-dark": "#2E7D32", // Updated

                // New UI Palette
                "sky-soft": "#E0F7FA",
                "grass-light": "#DCEDC8",
                "grass-vivid": "#AED581",
                "background-light": "#F1F8E9", // Updated: Light green tint
                "background-dark": "#0F172A", // Updated: Slate 900
                "card-light": "#FFFFFF",
                "card-dark": "#1E293B",
                "text-main-light": "#1B3B1F",
                "text-main-dark": "#F3F4F6",
                "text-sub-light": "#558B2F",
                "text-sub-dark": "#9CA3AF",

                // Plan Detail Palette
                "pasture-sky": "#e0f2fe",
                "pasture-green": "#dcfce7",
                "pasture-green-dark": "#166534",
                "pasture-blue-dark": "#0369a1",

                // Legacy iOS Compatibility (Keep for un-migrated screens)
                "ios-green": "#34C759",
                "ios-blue": "#007AFF",
                "ios-orange": "#FF9500",
                "ios-red": "#FF3B30",
                "ios-purple": "#AF52DE",
                "ios-teal": "#30B0C7",

                "ios-bg-light": "#F2F2F7",
                "ios-bg-dark": "#000000",
                "ios-card-light": "#FFFFFF",
                "ios-card-dark": "#1C1C1E",

                "text-main": "#000000",
                "text-secondary": "#3C3C43",
                "text-muted": "#8E8E93",

                "bubble-rec-light": "#E9E9EB",
                "bubble-rec-dark": "#262626",
                "separator-light": "#C6C6C8",
                "separator-dark": "#38383A",
            },
            fontFamily: {
                "sans": ["Noto Sans KR", "Inter", "sans-serif"],
                "display": ["Noto Sans KR", "Inter", "sans-serif"],
            },
            borderRadius: {
                "xl": "12px",
                "2xl": "20px",
                "3xl": "24px",
                "bubble": "1.25rem",
            },
            boxShadow: {
                "soft": "0 8px 40px -12px rgba(0,0,0,0.1)",
                "card": "0 2px 8px rgba(0,0,0,0.04)",
                "glow": "0 0 32px rgba(52, 199, 89, 0.25)",
                "ios": "0 4px 20px rgba(0, 0, 0, 0.05)",
                "ios-lg": "0 10px 30px rgba(0, 0, 0, 0.08)",
                "apple": "0 4px 12px rgba(0,0,0,0.05)",
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                pop: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
            animation: {
                float: 'float 3s ease-in-out infinite',
                pop: 'pop 0.3s ease-out forwards',
            }
        },
    },
    plugins: [],
};

export default config;
