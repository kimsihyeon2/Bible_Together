'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAudio, SPEED_OPTIONS } from '@/lib/audio-context';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';

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
        playNext,
        playPrevious,
        setSpeed,
        playbackRate,
        autoPlayNext,
        setAutoPlayNext,
        error
    } = useAudio();

    const [isExpanded, setIsExpanded] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    // Draggable position state for mini player
    const [miniPosition, setMiniPosition] = useState({ x: 0, y: 0 });
    const dragControls = useDragControls();

    // Load saved position from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPos = localStorage.getItem('audioPlayerPosition');
            if (savedPos) {
                try {
                    const pos = JSON.parse(savedPos);
                    setMiniPosition(pos);
                } catch (e) { }
            }
        }
    }, []);

    // Save position when drag ends
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const newPos = {
            x: miniPosition.x + info.offset.x,
            y: miniPosition.y + info.offset.y
        };
        setMiniPosition(newPos);
        localStorage.setItem('audioPlayerPosition', JSON.stringify(newPos));
    };

    if (!currentBook) return null;

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    // ========== EXPANDED MODE ==========
                    <motion.div
                        key="expanded"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-[84px] left-2 right-2 z-40"
                    >
                        <div className="bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                            {/* Album Art / Header */}
                            <div className="bg-gradient-to-br from-primary/20 to-green-500/10 dark:from-primary/30 dark:to-green-500/20 p-4 pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${isPlaying ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-primary'}`}>
                                            <span className={`material-symbols-outlined text-2xl ${isPlaying ? 'animate-pulse' : ''}`}>
                                                headphones
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-800 dark:text-white">
                                                {currentBook} {currentChapter}장
                                            </h4>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {error ? <span className="text-red-500">{error}</span> : "오디오 성경"}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1.5 rounded-full bg-black/5 dark:bg-white/10"
                                    >
                                        <span className="material-symbols-outlined text-slate-500 text-lg">expand_more</span>
                                    </button>
                                </div>
                            </div>

                            <div className="px-4 pb-4">
                                {/* Progress Bar */}
                                <div className="pt-3 pb-2">
                                    <div
                                        className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer group"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const newTime = (x / rect.width) * duration;
                                            seek(newTime);
                                        }}
                                    >
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-150 group-hover:bg-green-600"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-slate-400 font-mono">{formatTime(currentTime)}</span>
                                        <span className="text-[10px] text-slate-400 font-mono">{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Main Controls */}
                                <div className="flex items-center justify-center gap-2 py-2">
                                    {/* Previous */}
                                    <button
                                        onClick={playPrevious}
                                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-90 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-2xl">skip_previous</span>
                                    </button>

                                    {/* Rewind 10s */}
                                    <button
                                        onClick={() => seek(Math.max(0, currentTime - 10))}
                                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-90 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-xl">replay_10</span>
                                    </button>

                                    {/* Play/Pause */}
                                    <button
                                        onClick={togglePlay}
                                        disabled={isLoading}
                                        className="w-16 h-16 rounded-full bg-primary hover:bg-green-600 text-white flex items-center justify-center shadow-xl active:scale-95 transition-all mx-2"
                                    >
                                        {isLoading ? (
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl filled">
                                                {isPlaying ? 'pause' : 'play_arrow'}
                                            </span>
                                        )}
                                    </button>

                                    {/* Forward 10s */}
                                    <button
                                        onClick={() => seek(Math.min(duration, currentTime + 10))}
                                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-90 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-xl">forward_10</span>
                                    </button>

                                    {/* Next */}
                                    <button
                                        onClick={playNext}
                                        className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-90 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-2xl">skip_next</span>
                                    </button>
                                </div>

                                {/* Bottom Controls Row */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                                    {/* Speed Control */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300"
                                        >
                                            <span className="material-symbols-outlined text-base">speed</span>
                                            {playbackRate}x
                                        </button>

                                        {/* Speed Menu */}
                                        <AnimatePresence>
                                            {showSpeedMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 min-w-[100px]"
                                                >
                                                    {SPEED_OPTIONS.map((speed) => (
                                                        <button
                                                            key={speed}
                                                            onClick={() => {
                                                                setSpeed(speed);
                                                                setShowSpeedMenu(false);
                                                            }}
                                                            className={`w-full px-3 py-1.5 text-sm rounded-lg text-left transition-colors ${playbackRate === speed
                                                                ? 'bg-primary text-white'
                                                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                                }`}
                                                        >
                                                            {speed}x
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Auto-play Toggle */}
                                    <button
                                        onClick={() => setAutoPlayNext(!autoPlayNext)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${autoPlayNext
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-base">
                                            {autoPlayNext ? 'repeat_one_on' : 'repeat_one'}
                                        </span>
                                        자동재생
                                    </button>



                                    {/* Close */}
                                    <button
                                        onClick={stop}
                                        className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    // ========== MINI MODE (Pill) - DRAGGABLE ==========
                    <motion.div
                        key="mini"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1, x: miniPosition.x, y: miniPosition.y }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag
                        dragMomentum={false}
                        dragElastic={0.1}
                        onDragEnd={handleDragEnd}
                        className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-40 cursor-grab active:cursor-grabbing touch-none"
                        whileDrag={{ scale: 1.05 }}
                    >
                        <div className="flex items-center gap-1 bg-gradient-to-r from-primary to-green-600 text-white pl-1.5 pr-3 py-1 rounded-full shadow-lg">
                            {/* Drag Handle */}
                            <div className="w-1.5 h-6 flex flex-col justify-center gap-0.5 mr-0.5 opacity-50">
                                <div className="w-full h-0.5 bg-white/60 rounded-full"></div>
                                <div className="w-full h-0.5 bg-white/60 rounded-full"></div>
                                <div className="w-full h-0.5 bg-white/60 rounded-full"></div>
                            </div>
                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span className="material-symbols-outlined text-xl filled">
                                        {isPlaying ? 'pause' : 'play_arrow'}
                                    </span>
                                )}
                            </button>

                            {/* Expand button with title */}
                            <button
                                onClick={() => setIsExpanded(true)}
                                className="flex items-center gap-1.5 pl-1"
                            >
                                <span className="text-sm font-medium max-w-[100px] truncate">
                                    {currentBook} {currentChapter}장
                                </span>

                                {/* Equalizer */}
                                {isPlaying && !isLoading && (
                                    <span className="flex gap-0.5 items-end h-3">
                                        <span className="w-0.5 bg-white/80 rounded-full animate-[bounce_1s_infinite] h-2"></span>
                                        <span className="w-0.5 bg-white/80 rounded-full animate-[bounce_1.2s_infinite] h-3"></span>
                                        <span className="w-0.5 bg-white/80 rounded-full animate-[bounce_0.8s_infinite] h-1.5"></span>
                                    </span>
                                )}

                                <span className="material-symbols-outlined text-white/70 text-base">expand_less</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


        </>
    );
};
