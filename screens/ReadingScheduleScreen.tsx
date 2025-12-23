'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '../types';
import { useAuth } from '@/lib/auth-context';
import { useReadingPlan } from '@/lib/useReadingPlan';
import { DailyPlan, PlannerMode } from '@/lib/smart-bible-planner';

interface ReadingScheduleScreenProps {
    navigate: (screen: Screen) => void;
    onStartReading?: (book: string, chapter: number) => void;
}

interface CalendarDay {
    day: number;
    status: 'completed' | 'today' | 'future' | 'rest' | 'missed' | 'empty';
    plan?: DailyPlan;
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

/**
 * SOTA Reading Schedule Screen
 * Calendar-based reading plan view with streak stats
 * Powered by Dynamic Weighted Partitioning Algorithm
 */
const ReadingScheduleScreen: React.FC<ReadingScheduleScreenProps> = ({ navigate, onStartReading }) => {
    const { user } = useAuth();
    const {
        isLoading,
        isGenerating,
        plans,
        progress,
        stats,
        todayAssignment,
        generatePlan,
        completeTodayReading,
        getMonthPlans,
        resetPlan,
    } = useReadingPlan();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [selectedMode, setSelectedMode] = useState<PlannerMode>('NKRV');
    const [targetMinutes, setTargetMinutes] = useState(10);

    // Generate calendar data when month or plans change
    useEffect(() => {
        generateCalendarData();
    }, [currentMonth, plans, progress]);

    // Show setup modal if no plan exists
    useEffect(() => {
        if (!isLoading && plans.length === 0 && user) {
            setShowSetupModal(true);
        }
    }, [isLoading, plans, user]);

    const generateCalendarData = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get first day of month (0 = Sunday, adjust for Monday start)
        const firstDayOfMonth = new Date(year, month, 1);
        let startDay = firstDayOfMonth.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        // Get days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get plans for this month
        const monthPlans = getMonthPlans(year, month);

        // Generate days array
        const days: CalendarDay[] = [];

        // Empty slots before first day
        for (let i = 0; i < startDay; i++) {
            days.push({ day: 0, status: 'empty' });
        }

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            date.setHours(0, 0, 0, 0);
            const isToday = date.getTime() === today.getTime();
            const isPast = date < today;
            const isSunday = date.getDay() === 0;

            const plan = monthPlans.get(d);

            let status: CalendarDay['status'] = 'future';

            if (plan) {
                if (plan.isBufferDay) {
                    status = 'rest';
                } else if (plan.isCompleted) {
                    status = 'completed';
                } else if (isToday) {
                    status = 'today';
                } else if (isPast) {
                    status = 'missed';
                }
            } else if (isSunday && !plan) {
                status = 'rest';
            }

            days.push({
                day: d,
                status,
                plan,
            });
        }

        setCalendarDays(days);
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
            return newMonth;
        });
    };

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    };

    const handleDayClick = (day: CalendarDay) => {
        if (day.status === 'today' && day.plan && onStartReading) {
            onStartReading(day.plan.book, day.plan.startChapter);
        }
    };

    const handleStartSetup = async () => {
        await generatePlan(selectedMode, targetMinutes);
        setShowSetupModal(false);
    };

    const handleStartTodayReading = () => {
        if (todayAssignment && onStartReading) {
            onStartReading(todayAssignment.book, todayAssignment.startChapter);
            navigate(Screen.BIBLE);
        }
    };

    const renderDayCell = (day: CalendarDay, index: number) => {
        if (day.day === 0) {
            return <div key={`empty-${index}`} className="h-16 rounded-2xl" />;
        }

        const isToday = day.status === 'today';
        const isCompleted = day.status === 'completed';
        const isRest = day.status === 'rest';
        const isFuture = day.status === 'future';
        const isMissed = day.status === 'missed';

        const bookAbbrev = day.plan?.book?.substring(0, 2) || '';

        return (
            <motion.div
                key={`day-${day.day}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.015 }}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => handleDayClick(day)}
            >
                {/* Day Number */}
                <span className={`text-xs font-medium mb-1 ${isToday ? 'text-slate-800 font-bold' :
                        isRest ? 'text-sky-400' :
                            'text-slate-400'
                    }`}>
                    {day.day}
                </span>

                {/* Status Icon */}
                {isToday && (
                    <div className="relative">
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            TODAY
                        </span>
                        <div className="w-10 h-12 rounded-2xl bg-gradient-to-b from-green-400 to-green-600 text-white flex flex-col items-center justify-center shadow-lg shadow-green-500/30 ring-2 ring-green-100 ring-offset-2">
                            <span className="text-[9px] font-medium opacity-80 leading-none mb-0.5">
                                {bookAbbrev}
                            </span>
                            <span className="text-sm font-bold leading-none">{day.plan?.startChapter}</span>
                        </div>
                    </div>
                )}

                {isCompleted && (
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-lg">check</span>
                    </div>
                )}

                {isRest && (
                    <div className="w-10 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-400 flex flex-col items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-lg">local_cafe</span>
                    </div>
                )}

                {isFuture && day.plan && (
                    <div className="w-10 h-12 rounded-2xl bg-white border border-slate-100 text-slate-600 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[9px] font-bold text-slate-400 leading-none mb-0.5">
                            {bookAbbrev}
                        </span>
                        <span className="text-xs font-bold leading-none">{day.plan.startChapter}</span>
                    </div>
                )}

                {isFuture && !day.plan && (
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-lg">more_horiz</span>
                    </div>
                )}

                {isMissed && (
                    <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 text-red-400 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-green-50 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
            {/* Decorative Blobs */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-40 -left-20 w-72 h-72 bg-green-100/40 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-4 pt-12 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => navigate(Screen.DASHBOARD)}
                        className="w-10 h-10 rounded-full bg-white/60 dark:bg-slate-800/60 flex items-center justify-center text-slate-600 shadow-sm hover:bg-white transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                            {formatMonth(currentMonth)}
                        </h1>
                        <p className="text-xs text-green-600 font-medium tracking-wide uppercase mt-0.5">
                            {stats ? `Day ${stats.currentDay} / ${stats.totalDays}` : 'Reading Schedule'}
                        </p>
                    </div>

                    <button
                        onClick={() => navigateMonth('next')}
                        className="w-10 h-10 rounded-full bg-white/60 dark:bg-slate-800/60 flex items-center justify-center text-slate-600 shadow-sm hover:bg-white transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>

                {/* Month Navigation Arrows */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => navigateMonth('prev')}
                        className="text-xs text-slate-400 hover:text-green-600 font-medium flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        이전 달
                    </button>
                    <button
                        onClick={() => navigateMonth('next')}
                        className="text-xs text-slate-400 hover:text-green-600 font-medium flex items-center gap-1"
                    >
                        다음 달
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </header>

            {/* Loading State */}
            {(isLoading || isGenerating) && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
                        <p className="text-sm text-slate-500">
                            {isGenerating ? '읽기 계획 생성 중...' : '로딩 중...'}
                        </p>
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            {!isLoading && !isGenerating && (
                <main className="relative z-10 px-4 pb-32">
                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-4 shadow-lg shadow-green-900/5 border border-white/50 dark:border-slate-700">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 mb-4">
                            {WEEKDAYS.map((day, i) => (
                                <div
                                    key={day}
                                    className={`text-center text-[10px] font-bold uppercase tracking-wider py-2 ${i === 6 ? 'text-sky-500' : 'text-slate-400'
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                            {calendarDays.map((day, index) => renderDayCell(day, index))}
                        </div>
                    </div>
                </main>
            )}

            {/* Bottom Sheet - Stats */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-t-[2.5rem] p-6 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-white/50 dark:border-slate-800">
                    {/* Handle */}
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Streak */}
                        <div className="bg-green-50/50 dark:bg-green-900/20 p-4 rounded-3xl flex flex-col items-start relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10">
                                <span className="material-symbols-outlined text-6xl text-green-600">local_fire_department</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-green-500 mb-3 shadow-sm">
                                <span className="material-symbols-outlined text-xl">local_fire_department</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-green-700 dark:text-green-400 tracking-wider mb-0.5">
                                    연속 읽기
                                </p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {stats?.currentStreak || 0} <span className="text-sm font-medium text-slate-500">일</span>
                                </p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="bg-sky-50/50 dark:bg-sky-900/20 p-4 rounded-3xl flex flex-col items-start relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10">
                                <span className="material-symbols-outlined text-6xl text-sky-600">menu_book</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sky-500 mb-3 shadow-sm">
                                <span className="material-symbols-outlined text-xl">menu_book</span>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400 tracking-wider mb-0.5">
                                    진행률
                                </p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                    {stats?.progressPercent || 0}<span className="text-sm font-medium text-slate-500">%</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-between px-2">
                        <button
                            onClick={() => setShowSetupModal(true)}
                            className="flex items-center gap-2 text-slate-400 hover:text-green-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-xl">tune</span>
                            <span className="text-xs font-semibold">설정</span>
                        </button>

                        <button
                            onClick={handleStartTodayReading}
                            disabled={!todayAssignment}
                            className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {todayAssignment
                                ? `${todayAssignment.book} ${todayAssignment.startChapter}장 읽기`
                                : '오늘 읽기 완료!'
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* Setup Modal */}
            <AnimatePresence>
                {showSetupModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => plans.length > 0 && setShowSetupModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
                        >
                            <h2 className="text-xl font-bold text-center mb-2">📖 1년 성경읽기 계획</h2>
                            <p className="text-sm text-slate-500 text-center mb-6">
                                스마트 알고리즘으로 나만의 맞춤 계획을 생성합니다
                            </p>

                            {/* Mode Selection */}
                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">역본 선택</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setSelectedMode('NKRV')}
                                        className={`p-3 rounded-xl border-2 transition-all ${selectedMode === 'NKRV'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-slate-200 dark:border-slate-600'
                                            }`}
                                    >
                                        <p className="font-bold text-sm">개역개정</p>
                                        <p className="text-[10px] text-slate-400">인지 부하 고려</p>
                                    </button>
                                    <button
                                        onClick={() => setSelectedMode('EASY')}
                                        className={`p-3 rounded-xl border-2 transition-all ${selectedMode === 'EASY'
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-slate-200 dark:border-slate-600'
                                            }`}
                                    >
                                        <p className="font-bold text-sm">쉬운성경</p>
                                        <p className="text-[10px] text-slate-400">흐름 중심 읽기</p>
                                    </button>
                                </div>
                            </div>

                            {/* Time Selection */}
                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">하루 목표 시간</p>
                                <div className="flex gap-2">
                                    {[5, 10, 15, 20].map((min) => (
                                        <button
                                            key={min}
                                            onClick={() => setTargetMinutes(min)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${targetMinutes === min
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                        >
                                            {min}분
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleStartSetup}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-xl transition-all disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        생성 중...
                                    </span>
                                ) : (
                                    '계획 생성하기'
                                )}
                            </button>

                            {plans.length > 0 && (
                                <button
                                    onClick={() => setShowSetupModal(false)}
                                    className="w-full mt-3 text-slate-400 text-sm font-medium"
                                >
                                    취소
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ReadingScheduleScreen;
