
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
    isLoading: boolean;
    message?: string; // Optional custom message
}

const VERSES = [
    { text: "He makes me lie down in green pastures, he leads me beside quiet waters.", ref: "Psalm 23:2" },
    { text: "For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.", ref: "Jeremiah 29:11" },
    { text: "I can do all this through him who gives me strength.", ref: "Philippians 4:13" },
    { text: "But those who hope in the Lord will renew their strength. They will soar on wings like eagles.", ref: "Isaiah 40:31" },
    { text: "Trust in the Lord with all your heart and lean not on your own understanding.", ref: "Proverbs 3:5" },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, message }) => {
    const [verseIndex, setVerseIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    // Verse rotation timer
    useEffect(() => {
        if (!isLoading) {
            setProgress(100);
            return;
        }

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
                    <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center mb-4 ring-1 ring-slate-100 dark:ring-slate-700">
                        <span className="material-symbols-outlined text-primary text-4xl">local_library</span>
                    </div>
                    <h1 className="text-slate-900 dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center">
                        Bible Together
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                        Loading your community...
                    </p>
                </div>

                {/* Stitch Illustration Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-blue-100/50 dark:shadow-black/50 relative mb-12 group"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000"
                        style={{ backgroundImage: 'url("/loading-stitch.png")', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: '#f0f9ff' }} // Added background color to match typical stitch aesthetics if transparency issues exist
                    />
                    {/* Gentle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </motion.div>

                {/* Loading & Scripture Section */}
                <div className="w-full space-y-8">

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <p className="text-slate-700 dark:text-slate-200 text-sm font-medium leading-normal">
                                {message || "Loading daily scripture..."}
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
                    <div className="relative p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[140px] flex flex-col justify-center">
                        <span className="material-symbols-outlined absolute top-4 left-4 text-primary/20 text-4xl select-none">format_quote</span>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={verseIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="relative z-10"
                            >
                                <p className="text-slate-800 dark:text-slate-100 text-lg font-medium leading-relaxed text-center italic">
                                    "{VERSES[verseIndex].text}"
                                </p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs font-bold text-center mt-3 uppercase tracking-wider">
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
