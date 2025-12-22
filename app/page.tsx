"use client";

import React, { useState, useEffect } from 'react';
import { Screen } from '@/types';
import { Language, translations } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import BibleScreen from '@/screens/BibleScreen';
import CommunityScreen from '@/screens/CommunityScreen';
import AdminScreen from '@/screens/AdminScreen';
import PlanDetailScreen from '@/screens/PlanDetailScreen';
import PlanListScreen from '@/screens/PlanListScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import ChatScreen from '@/screens/ChatScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import SecurityScreen from '@/screens/SecurityScreen';
import PrivacyPolicyScreen from '@/screens/PrivacyPolicyScreen';
import HelpScreen from '@/screens/HelpScreen';
import { BottomNav } from '@/components/BottomNav';

// Hash-based routing map
const ROUTE_MAP: Record<string, Screen> = {
    '': Screen.LOGIN,
    '#/login': Screen.LOGIN,
    '#/dashboard': Screen.DASHBOARD,
    '#/bible': Screen.BIBLE,
    '#/community': Screen.COMMUNITY,
    '#/admin': Screen.ADMIN,
    '#/plan-detail': Screen.PLAN_DETAIL,
    '#/plan/today': Screen.PLAN_DETAIL,
    '#/plans': Screen.PLAN_LIST,
    '#/progress': Screen.PROGRESS,
    '#/chat': Screen.CHAT,
    '#/settings': Screen.SETTINGS,
    '#/settings/security': Screen.SECURITY,
    '#/settings/privacy': Screen.PRIVACY,
    '#/settings/help': Screen.HELP,
};

const SCREEN_TO_HASH: Record<Screen, string> = {
    [Screen.LOGIN]: '#/login',
    [Screen.DASHBOARD]: '#/dashboard',
    [Screen.BIBLE]: '#/bible',
    [Screen.COMMUNITY]: '#/community',
    [Screen.ADMIN]: '#/admin',
    [Screen.PLAN_DETAIL]: '#/plan-detail',
    [Screen.PLAN_LIST]: '#/plans',
    [Screen.PROGRESS]: '#/progress',
    [Screen.CHAT]: '#/chat',
    [Screen.SETTINGS]: '#/settings',
    [Screen.SECURITY]: '#/settings/security',
    [Screen.PRIVACY]: '#/settings/privacy',
    [Screen.HELP]: '#/settings/help',
};

const getScreenFromHash = (): Screen => {
    if (typeof window === 'undefined') return Screen.LOGIN;
    const hash = window.location.hash;
    return ROUTE_MAP[hash] || Screen.LOGIN;
};

const getSavedLanguage = (): Language => {
    if (typeof window === 'undefined') return 'ko';
    const saved = localStorage.getItem('language');
    if (saved === 'ko' || saved === 'en') return saved;
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('ko') ? 'ko' : 'en';
};

export default function HomePage() {
    const { user, loading: authLoading } = useAuth();
    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [language, setLanguage] = useState<Language>('ko');
    const [mounted, setMounted] = useState(false);

    const t = translations[language];

    // Initial mount effect
    useEffect(() => {
        setMounted(true);
        setLanguage(getSavedLanguage());
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    // Auth state redirect effect
    useEffect(() => {
        if (!mounted || authLoading) return;

        if (user) {
            // User is logged in, go to dashboard if on login screen
            if (currentScreen === Screen.LOGIN) {
                navigate(Screen.DASHBOARD);
            }
        } else {
            // User is not logged in, go to login screen
            if (currentScreen !== Screen.LOGIN) {
                navigate(Screen.LOGIN);
            }
        }
    }, [user, authLoading, mounted]);

    // Hash change listener
    useEffect(() => {
        if (!mounted) return;

        const handleHashChange = () => {
            const screen = getScreenFromHash();
            // Protect routes - redirect to login if not authenticated
            if (!user && screen !== Screen.LOGIN) {
                window.location.hash = '#/login';
                return;
            }
            setCurrentScreen(screen);
            window.scrollTo(0, 0);
        };

        window.addEventListener('hashchange', handleHashChange);

        // Set initial screen based on auth state
        const initialScreen = getScreenFromHash();
        // Allow setting screen if user exists OR if we are still loading (optimistic) OR if it's public (Login)
        if (user || authLoading || initialScreen === Screen.LOGIN) {
            setCurrentScreen(initialScreen);
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [mounted, user, authLoading]);

    // Dark mode effect
    useEffect(() => {
        if (!mounted) return;
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode, mounted]);

    // Language save effect
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem('language', language);
    }, [language, mounted]);

    const navigate = (screen: Screen) => {
        setCurrentScreen(screen);
        window.location.hash = SCREEN_TO_HASH[screen];
        window.scrollTo(0, 0);
    };

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);
    const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'ko' : 'en');

    // Loading state
    if (!mounted || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="relative z-10 flex flex-col h-full max-w-md mx-auto min-h-screen pb-32">
                    <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <img src="/icon.png" className="absolute inset-0 w-full h-full p-3 object-contain animate-pulse" alt="Logo" />
                    </div>
                </div>
            </div>
        );
    }

    const renderScreen = () => {
        switch (currentScreen) {
            case Screen.LOGIN:
                return <LoginScreen navigate={navigate} t={t} />;
            case Screen.DASHBOARD:
                return <DashboardScreen navigate={navigate} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} t={t} />;
            case Screen.BIBLE:
                return <BibleScreen navigate={navigate} />;
            case Screen.COMMUNITY:
                return <CommunityScreen navigate={navigate} t={t} />;
            case Screen.ADMIN:
                return <AdminScreen navigate={navigate} t={t} />;
            case Screen.PLAN_DETAIL:
                return <PlanDetailScreen navigate={navigate} t={t} />;
            case Screen.PLAN_LIST:
                return <PlanListScreen navigate={navigate} t={t} />;
            case Screen.PROGRESS:
                return <ProgressScreen navigate={navigate} t={t} />;
            case Screen.CHAT:
                return <ChatScreen navigate={navigate} t={t} />;
            case Screen.SETTINGS:
                return <SettingsScreen navigate={navigate} language={language} toggleLanguage={toggleLanguage} t={t} />;
            case Screen.SECURITY:
                return <SecurityScreen navigate={navigate} />;
            case Screen.PRIVACY:
                return <PrivacyPolicyScreen navigate={navigate} />;
            case Screen.HELP:
                return <HelpScreen navigate={navigate} />;
            default:
                return <LoginScreen navigate={navigate} t={t} />;
        }
    };

    const showBottomNav = [
        Screen.DASHBOARD,
        Screen.BIBLE,
        Screen.COMMUNITY,
        Screen.SETTINGS,
        Screen.PROGRESS,
        // Screen.CHAT, // Hide BottomNav in Chat to allowing typed input
    ].includes(currentScreen);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen">
            {renderScreen()}
            {showBottomNav && <BottomNav currentScreen={currentScreen} navigate={navigate} t={t} />}
        </div>
    );
}
