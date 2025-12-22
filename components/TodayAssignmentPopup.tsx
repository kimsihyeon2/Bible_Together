'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '../types';

interface TodayAssignmentPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onStartReading: (book: string, chapter: number) => void;
    // Reading plan data (can be fetched or passed as props)
    currentDay?: number;
    totalDays?: number;
    book?: string;
    startChapter?: number;
    endChapter?: number;
    estimatedMinutes?: number;
    theme?: string;
}

/**
 * SOTA Today's Assignment Popup
 * Shows daily reading assignment with progress and CTA
 * Inspired by pasture-themed design with glassmorphism
 */
export const TodayAssignmentPopup: React.FC<TodayAssignmentPopupProps> = ({
    isOpen,
    onClose,
    onStartReading,
    currentDay = 45,
    totalDays = 365,
    book = '출애굽기',
    startChapter = 12,
    endChapter = 12,
    estimatedMinutes = 10,
    theme = '유월절 규정',
}) => {
    const [selectedTranslation, setSelectedTranslation] = useState<'개역개정' | '쉬운성경'>('개역개정');
    const progressPercent = Math.round((currentDay / totalDays) * 100);

    const handleStart = () => {
        onStartReading(book, startChapter);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-sm overflow-hidden"
                >
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-green-50 dark:from-slate-800 dark:to-slate-900 rounded-[2.5rem]" />

                    {/* Sky Gradient Overlay */}
                    <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-100/40 to-transparent pointer-events-none rounded-t-[2.5rem]" />

                    <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl shadow-green-900/10 border border-white/50 dark:border-slate-700">
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>

                        {/* Header: Day Progress */}
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">오늘의 말씀</h2>

                            <div className="flex justify-between items-end mb-2 px-1">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Day {currentDay}</span>
                                    <span className="text-xs text-slate-400 font-medium">/ {totalDays}</span>
                                </div>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{progressPercent}%</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-3 bg-white/60 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm shadow-sm ring-1 ring-white/50 dark:ring-slate-600">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                                />
                            </div>
                        </div>

                        {/* Main Card */}
                        <div className="bg-white dark:bg-slate-700/50 rounded-[2rem] p-6 shadow-lg shadow-green-900/5 border border-white/80 dark:border-slate-600 mb-6">
                            {/* Meta Info */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-600/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-500">
                                    <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">약 {estimatedMinutes}분</span>
                                </div>

                                {/* Difficulty Stars */}
                                <div className="flex gap-0.5">
                                    {[1, 2, 3].map((i) => (
                                        <span key={i} className="material-symbols-outlined text-amber-400 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                    ))}
                                    {[4, 5].map((i) => (
                                        <span key={i} className="material-symbols-outlined text-slate-200 dark:text-slate-600 text-lg">star</span>
                                    ))}
                                </div>
                            </div>

                            {/* Book & Chapter */}
                            <div className="text-center mb-6">
                                <span className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-4 border border-green-200 dark:border-green-800 shadow-sm">
                                    {theme}
                                </span>
                                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white leading-tight tracking-tight">
                                    {book}
                                </h3>
                                <p className="text-2xl font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                    {startChapter === endChapter
                                        ? `${startChapter}장`
                                        : `${startChapter}장 ~ ${endChapter}장`
                                    }
                                </p>
                            </div>

                            {/* Book Icon */}
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-600 dark:to-slate-500 flex items-center justify-center text-green-600 dark:text-green-400 shadow-inner ring-4 ring-white dark:ring-slate-700">
                                    <span className="material-symbols-outlined text-3xl">menu_book</span>
                                </div>
                            </div>
                        </div>

                        {/* Translation Selector */}
                        <div className="flex justify-center mb-6">
                            <div className="bg-slate-200/60 dark:bg-slate-700/60 p-1.5 rounded-2xl inline-flex backdrop-blur-md">
                                <button
                                    onClick={() => setSelectedTranslation('개역개정')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedTranslation === '개역개정'
                                            ? 'bg-white dark:bg-slate-600 shadow-sm text-green-700 dark:text-green-300 border border-green-50/50 dark:border-transparent'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                        }`}
                                >
                                    개역개정
                                </button>
                                <button
                                    onClick={() => setSelectedTranslation('쉬운성경')}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedTranslation === '쉬운성경'
                                            ? 'bg-white dark:bg-slate-600 shadow-sm text-green-700 dark:text-green-300 border border-green-50/50 dark:border-transparent'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                                        }`}
                                >
                                    쉬운성경
                                </button>
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={handleStart}
                            className="w-full group relative overflow-hidden bg-green-500 hover:bg-green-600 text-white font-bold text-lg py-4 rounded-[2rem] shadow-xl shadow-green-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-b-4 border-green-600 active:border-b-0 active:translate-y-1"
                        >
                            <span className="relative z-10">읽기 시작</span>
                            <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>

                            {/* Shine Animation */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TodayAssignmentPopup;
