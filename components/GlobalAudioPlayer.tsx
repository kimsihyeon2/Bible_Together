'use client';

import React, { useState } from 'react';
import { useAudio } from '@/lib/audio-context';
import { motion, AnimatePresence } from 'framer-motion';

export const GlobalAudioPlayer = () => {
    const {
        isPlaying,
        isLoading,
        currentBook,
        currentChapter,
        togglePlay,
        duration,
        currentTime,
        seek,
        stop,
        error
    } = useAudio();

    const [isExpanded, setIsExpanded] = useState(false);

    // Only show if there's an active track
    if (!currentBook) return null;

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence mode="wait">
            {isExpanded ? (
                // ========== EXPANDED MODE ==========
                <motion.div
                    key="expanded"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-[84px] left-3 right-3 z-40"
                >
                    <div className="bg-white/95 dark:bg-slate-800/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-4">
                        {/* Header with minimize */}
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPlaying ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                    <span className={`material-symbols-outlined ${isPlaying ? 'animate-pulse' : ''}`}>
                                        music_note
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                                        {currentBook} {currentChapter}장
                                    </h4>
                                    <span className="text-xs text-slate-500">
                                        {error ? <span className="text-red-500">{error}</span> : "Community Bible Reading"}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <span className="material-symbols-outlined text-xl">expand_more</span>
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full flex items-center gap-3 mb-3">
                            <span className="text-[11px] text-slate-500 w-9 text-right font-mono">{formatTime(currentTime)}</span>
                            <div
                                className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden cursor-pointer"
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const newTime = (x / rect.width) * duration;
                                    seek(newTime);
                                }}
                            >
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-150"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="text-[11px] text-slate-500 w-9 font-mono">{formatTime(duration)}</span>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => seek(Math.max(0, currentTime - 10))}
                                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                <span className="material-symbols-outlined text-2xl">replay_10</span>
                            </button>

                            <button
                                onClick={togglePlay}
                                disabled={isLoading}
                                className="w-14 h-14 rounded-full bg-primary hover:bg-green-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-3xl filled">
                                        {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => seek(Math.min(duration, currentTime + 10))}
                                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            >
                                <span className="material-symbols-outlined text-2xl">forward_10</span>
                            </button>

                            <button
                                onClick={stop}
                                className="p-2 text-slate-400 hover:text-red-500"
                            >
                                <span className="material-symbols-outlined text-xl">close</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                // ========== MINI MODE (Pill) ==========
                <motion.div
                    key="mini"
                    initial={{ y: 50, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-40"
                >
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="flex items-center gap-2 bg-primary text-white pl-2 pr-4 py-1.5 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
                    >
                        {/* Play/Pause minibutton */}
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                togglePlay();
                            }}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined text-lg filled">
                                    {isPlaying ? 'pause' : 'play_arrow'}
                                </span>
                            )}
                        </div>

                        {/* Title */}
                        <span className="text-sm font-medium max-w-[120px] truncate">
                            {currentBook} {currentChapter}장
                        </span>

                        {/* Equalizer animation */}
                        {isPlaying && !isLoading && (
                            <span className="flex gap-0.5 items-end h-3 ml-1">
                                <span className="w-0.5 bg-white/80 animate-[bounce_1s_infinite] h-2 rounded-full"></span>
                                <span className="w-0.5 bg-white/80 animate-[bounce_1.2s_infinite] h-3 rounded-full"></span>
                                <span className="w-0.5 bg-white/80 animate-[bounce_0.8s_infinite] h-1.5 rounded-full"></span>
                            </span>
                        )}

                        {/* Error indicator */}
                        {error && (
                            <span className="material-symbols-outlined text-red-300 text-sm">error</span>
                        )}

                        {/* Expand arrow */}
                        <span className="material-symbols-outlined text-white/70 text-lg">expand_less</span>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
