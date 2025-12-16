"use client";

import React, { useState, useEffect } from 'react';
import { Screen } from '@/types';
import { Language, translations } from '@/i18n';
import { useAuth } from '@/lib/auth-context';
import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import BibleScreen from '@/screens/BibleScreen';
import PlanDetailScreen from '@/screens/PlanDetailScreen';
import ProgressScreen from '@/screens/ProgressScreen';
import ChatScreen from '@/screens/ChatScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { BottomNav } from '@/components/BottomNav';

// Hash-based routing map
const ROUTE_MAP: Record<string, Screen> = {
    '': Screen.LOGIN,
    '#/login': Screen.LOGIN,
    '#/dashboard': Screen.DASHBOARD,
    '#/bible': Screen.BIBLE,
    '#/community': Screen.COMMUNITY,
    '#/plan-detail': Screen.PLAN_DETAIL,
    '#/plan/today': Screen.PLAN_DETAIL,
    '#/progress': Screen.PROGRESS,
    '#/chat': Screen.CHAT,
    '#/settings': Screen.SETTINGS,
};

const SCREEN_TO_HASH: Record<Screen, string> = {
    [Screen.LOGIN]: '#/login',
    [Screen.DASHBOARD]: '#/dashboard',
    [Screen.BIBLE]: '#/bible',
    [Screen.COMMUNITY]: '#/community',
    [Screen.PLAN_DETAIL]: '#/plan-detail',
    [Screen.PROGRESS]: '#/progress',
    [Screen.CHAT]: '#/chat',
    [Screen.SETTINGS]: '#/settings',
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
        if (user || initialScreen === Screen.LOGIN) {
            setCurrentScreen(initialScreen);
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [mounted, user]);

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
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-primary text-xl font-semibold">함께 성경</div>
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
                return <BibleScreen navigate={navigate} t={t} />;
            case Screen.COMMUNITY:
                return <DashboardScreen navigate={navigate} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} t={t} />;
            case Screen.PLAN_DETAIL:
                return <PlanDetailScreen navigate={navigate} t={t} />;
            case Screen.PROGRESS:
                return <ProgressScreen navigate={navigate} t={t} />;
            case Screen.CHAT:
                return <ChatScreen navigate={navigate} t={t} />;
            case Screen.SETTINGS:
                return <SettingsScreen navigate={navigate} language={language} toggleLanguage={toggleLanguage} t={t} />;
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
        Screen.CHAT,
    ].includes(currentScreen);

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen">
            {renderScreen()}
            {showBottomNav && <BottomNav currentScreen={currentScreen} navigate={navigate} t={t} />}
        </div>
    );
}
