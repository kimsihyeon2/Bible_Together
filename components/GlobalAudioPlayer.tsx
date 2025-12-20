'use client';

import React from 'react';
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

    // Only show if there's an active track or loading
    // We can also let the user close it, but for now we show if book is set
    if (!currentBook) return null;

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-[84px] left-4 right-4 z-40"
            >
                <div className="bg-white/90 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700 p-3 flex flex-col gap-2">
                    {/* Top Row: Info & Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {/* Artwork / Icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPlaying ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                <span className={`material-symbols-outlined ${isPlaying ? 'animate-pulse' : ''}`}>
                                    music_note
                                </span>
                            </div>

                            {/* Text Info */}
                            <div className="flex flex-col min-w-0">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                    {currentBook} {currentChapter}장
                                </h4>
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {error ? <span className="text-red-500">{error}</span> : "Community Bible Reading"}
                                </span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            {/* Rewind 10s */}
                            <button
                                onClick={() => seek(Math.max(0, currentTime - 10))}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-outlined text-[20px]">replay_10</span>
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                disabled={isLoading}
                                className="w-10 h-10 rounded-full bg-primary hover:bg-green-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-all"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-[24px] filled">
                                        {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                )}
                            </button>

                            {/* Close Button */}
                            <button
                                onClick={stop}
                                className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                                title="닫기"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 w-8 text-right font-mono">{formatTime(currentTime)}</span>
                        <div
                            className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative cursor-pointer group"
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const width = rect.width;
                                const newTime = (x / width) * duration;
                                seek(newTime);
                            }}
                        >
                            <div
                                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-100"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-slate-400 w-8 font-mono">{formatTime(duration)}</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
