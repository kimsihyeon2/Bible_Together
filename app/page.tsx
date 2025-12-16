"use client";

import React, { useState, useEffect } from 'react';
import { Screen } from '@/types';
import { Language, translations } from '@/i18n';
import LoginScreen from '@/screens/LoginScreen';
import DashboardScreen from '@/screens/DashboardScreen';
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
    '#/plan-detail': Screen.PLAN_DETAIL,
    '#/plan/today': Screen.PLAN_DETAIL,
    '#/progress': Screen.PROGRESS,
    '#/chat': Screen.CHAT,
    '#/settings': Screen.SETTINGS,
};

const SCREEN_TO_HASH: Record<Screen, string> = {
    [Screen.LOGIN]: '#/login',
    [Screen.DASHBOARD]: '#/dashboard',
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
    const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [language, setLanguage] = useState<Language>('ko');
    const [mounted, setMounted] = useState(false);

    const t = translations[language];

    useEffect(() => {
        setMounted(true);
        setCurrentScreen(getScreenFromHash());
        setLanguage(getSavedLanguage());
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const handleHashChange = () => {
            setCurrentScreen(getScreenFromHash());
            window.scrollTo(0, 0);
        };

        window.addEventListener('hashchange', handleHashChange);

        if (!window.location.hash) {
            window.location.hash = '#/login';
        }

        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode, mounted]);

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

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light">
                <div className="animate-pulse text-primary text-2xl">함께 성경</div>
            </div>
        );
    }

    const renderScreen = () => {
        switch (currentScreen) {
            case Screen.LOGIN:
                return <LoginScreen navigate={navigate} t={t} />;
            case Screen.DASHBOARD:
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
