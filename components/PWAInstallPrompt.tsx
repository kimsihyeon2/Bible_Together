'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
    const [isStandalone, setIsStandalone] = useState(true); // Default to true to avoid flash
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Check if already in standalone mode
        const isStandaloneMode =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);

        if (isStandaloneMode) return;

        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
            // Show prompt for iOS after a delay if not previously dismissed
            const dismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!dismissed) {
                setTimeout(() => setShowPrompt(true), 3000);
            }
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
            // Android prompt is triggered by event
        } else {
            setPlatform('desktop');
        }

        // Capture install prompt for Android/Desktop
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            const dismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Dismiss for 7 days
        // localStorage.setItem('pwa_prompt_dismissed', 'true');
        // Actually, for testing, maybe just session? Or let user re-open from settings?
        // Let's hide it for now.
    };

    if (!isMounted || isStandalone || !showPrompt) return null;

    return (
        <AnimatePresence>
            {showPrompt && (
                <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="w-full max-w-md p-4 pointer-events-auto"
                    >
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 relative overflow-hidden">
                            {/* Decorative Background */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500" />

                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>

                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                    <span className="material-symbols-outlined text-white text-3xl">book_2</span>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1">
                                        앱으로 설치하기
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                                        홈 화면에 추가하면 더 빠르고 편리하게 말씀을 묵상할 수 있어요.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5">
                                {platform === 'ios' ? (
                                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full shadow-sm font-bold text-primary text-xs">1</span>
                                            <span>하단 바의 <span className="inline-block align-middle mx-1"><span className="material-symbols-outlined text-lg text-blue-500">ios_share</span></span> 공유 버튼 선택</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                            <span className="w-6 h-6 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full shadow-sm font-bold text-primary text-xs">2</span>
                                            <span><span className="font-bold">"홈 화면에 추가"</span> 선택</span>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInstallClick}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                        지금 앱 설치하기
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
