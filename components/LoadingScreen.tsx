
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
    isLoading: boolean;
    message?: string; // Optional custom message
}

const VERSES = [
    { text: "여호와는 나의 목자시니 내게 부족함이 없으리로다", ref: "시편 23:1" },
    { text: "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라", ref: "빌립보서 4:13" },
    { text: "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라", ref: "이사야 41:10" },
    { text: "사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라", ref: "잠언 16:9" },
    { text: "오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요", ref: "이사야 40:31" },
    { text: "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라", ref: "요한복음 3:16" },
    { text: "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라", ref: "데살로니가전서 5:16-18" },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, message }) => {
    const [verseIndex, setVerseIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Random initial verse + Rotation
    useEffect(() => {
        if (!isLoading) {
            setProgress(100);
            return;
        }

        // Start with a random verse variation
        setVerseIndex(Math.floor(Math.random() * VERSES.length));

        const interval = setInterval(() => {
            setVerseIndex((prev) => (prev + 1) % VERSES.length);
        }, 5000); // 5 seconds rotation

        return () => clearInterval(interval);
    }, [isLoading]);

    // Simulated progress for "alive" feel
    useEffect(() => {
        if (!isLoading) return;

        // Fast start, then slow crawl
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev; // Stall at 90%
                return prev + Math.random() * 5;
            });
        }, 200);

        return () => clearInterval(interval);
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background-light dark:bg-background-dark font-sans overflow-hidden"
        >
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-50 to-background-light dark:from-slate-900 dark:to-background-dark -z-10" />

            {/* Main Content */}
            <div className="w-full max-w-md px-6 relative z-10 flex flex-col items-center">

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="h-20 w-20 relative mb-4 animate-float">
                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full"></div>
                        <img src="/icon.png" className="w-full h-full object-contain relative z-10 drop-shadow-sm" alt="App Logo" />
                    </div>
                    <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center">
                        그린 바이블
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        공동체와 함께하는 말씀 묵상
                    </p>
                </div>

                {/* Dynamic Illustration Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-blue-100/50 dark:shadow-black/50 relative mb-12 group"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
                        style={{
                            backgroundImage: 'url("/loading-church.png")',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}
                    />
                    {/* Gentle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Optional Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-primary text-sm">church</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Worship</span>
                    </div>
                </motion.div>

                {/* Loading & Scripture Section */}
                <div className="w-full space-y-8">

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-normal">
                                {message || "말씀을 불러오고 있어요..."}
                            </p>
                            <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                                {Math.min(100, Math.round(progress))}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(19,236,236,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ ease: "linear" }}
                            />
                        </div>
                    </div>

                    {/* Rotating Scripture */}
                    <div className="relative p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[160px] flex flex-col justify-center">
                        <span className="material-symbols-outlined absolute top-4 left-4 text-primary/20 text-4xl select-none">format_quote</span>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={verseIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="relative z-10 px-2"
                            >
                                <p className="text-slate-800 dark:text-slate-100 text-lg font-medium leading-relaxed text-center break-keep">
                                    "{VERSES[verseIndex].text}"
                                </p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold text-center mt-4 uppercase tracking-wider">
                                    {VERSES[verseIndex].ref}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </motion.div>
    );
};
