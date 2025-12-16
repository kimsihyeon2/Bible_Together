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
                "primary": "#34C759",
                "primary-hover": "#30B753",
                "primary-dark": "#248A3D",

                "ios-green": "#34C759",
                "ios-blue": "#007AFF",
                "ios-orange": "#FF9500",
                "ios-red": "#FF3B30",
                "ios-purple": "#AF52DE",
                "ios-teal": "#30B0C7",

                "background-light": "#F2F2F7",
                "background-dark": "#000000",

                "surface-light": "#ffffff",
                "surface-dark": "#1C1C1E",

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
            }
        },
    },
    plugins: [],
};

export default config;
