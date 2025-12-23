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
 * SOTA Reading Schedule Screen v2
 * - Sequential reading order (Genesis → Revelation)
 * - Interactive Day Detail Popup
 * - Full 66 books coverage
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
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

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

        const firstDayOfMonth = new Date(year, month, 1);
        let startDay = firstDayOfMonth.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthPlans = getMonthPlans(year, month);

        const days: CalendarDay[] = [];

        for (let i = 0; i < startDay; i++) {
            days.push({ day: 0, status: 'empty' });
        }

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

            days.push({ day: d, status, plan });
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
        if (day.plan && !day.plan.isBufferDay) {
            setSelectedDay(day);
        }
    };

    const handleStartSetup = async () => {
        await generatePlan(selectedMode, targetMinutes);
        setShowSetupModal(false);
    };

    const handleStartReading = (plan: DailyPlan) => {
        if (onStartReading && plan.book) {
            // SOTA Navigation: Save context to localStorage for instant load
            if (typeof window !== 'undefined') {
                localStorage.setItem('selectedBook', plan.book);
                localStorage.setItem('selectedChapter', plan.startChapter.toString());
            }
            onStartReading(plan.book, plan.startChapter);
            navigate(Screen.BIBLE);
        }
    };

    // Get book abbreviation
    const getAbbrev = (book: string) => {
        const abbrevMap: Record<string, string> = {
            '창세기': '창', '출애굽기': '출', '레위기': '레', '민수기': '민', '신명기': '신',
            '여호수아': '수', '사사기': '삿', '룻기': '룻', '사무엘상': '삼상', '사무엘하': '삼하',
            '열왕기상': '왕상', '열왕기하': '왕하', '역대상': '대상', '역대하': '대하',
            '에스라': '스', '느헤미야': '느', '에스더': '에', '욥기': '욥', '시편': '시',
            '잠언': '잠', '전도서': '전', '아가': '아', '이사야': '사', '예레미야': '렘',
            '예레미야애가': '애', '에스겔': '겔', '다니엘': '단', '호세아': '호', '요엘': '욜',
            '아모스': '암', '오바댜': '옵', '요나': '욘', '미가': '미', '나훔': '나',
            '하박국': '합', '스바냐': '습', '학개': '학', '스가랴': '슥', '말라기': '말',
            '마태복음': '마', '마가복음': '막', '누가복음': '눅', '요한복음': '요',
            '사도행전': '행', '로마서': '롬', '고린도전서': '고전', '고린도후서': '고후',
            '갈라디아서': '갈', '에베소서': '엡', '빌립보서': '빌', '골로새서': '골',
            '데살로니가전서': '살전', '데살로니가후서': '살후', '디모데전서': '딤전',
            '디모데후서': '딤후', '디도서': '딛', '빌레몬서': '몬', '히브리서': '히',
            '야고보서': '약', '베드로전서': '벧전', '베드로후서': '벧후',
            '요한일서': '요일', '요한이서': '요이', '요한삼서': '요삼',
            '유다서': '유', '요한계시록': '계',
        };
        return abbrevMap[book] || book.substring(0, 2);
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

        const abbrev = day.plan?.book ? getAbbrev(day.plan.book) : '';

        return (
            <motion.div
                key={`day-${day.day}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => handleDayClick(day)}
            >
                <span className={`text-xs font-medium mb-1 ${isToday ? 'text-slate-800 font-bold' :
                    isRest ? 'text-sky-400' : 'text-slate-400'
                    }`}>
                    {day.day}
                </span>

                {isToday && (
                    <div className="relative">
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            TODAY
                        </span>
                        <div className="w-10 h-12 rounded-2xl bg-gradient-to-b from-green-400 to-green-600 text-white flex flex-col items-center justify-center shadow-lg shadow-green-500/30 ring-2 ring-green-100 ring-offset-2 group-hover:scale-105 transition-transform">
                            <span className="text-[8px] font-medium opacity-80 leading-none mb-0.5">{abbrev}</span>
                            <span className="text-sm font-bold leading-none">{day.plan?.startChapter}</span>
                        </div>
                    </div>
                )}

                {isCompleted && (
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-lg">check</span>
                    </div>
                )}

                {isRest && (
                    <div className="w-10 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-sky-400 flex flex-col items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-lg">local_cafe</span>
                    </div>
                )}

                {isFuture && day.plan && (
                    <div className="w-10 h-12 rounded-2xl bg-white border border-slate-100 text-slate-600 flex flex-col items-center justify-center shadow-sm group-hover:scale-105 group-hover:border-green-300 transition-all">
                        <span className="text-[8px] font-bold text-slate-400 leading-none mb-0.5">{abbrev}</span>
                        <span className="text-xs font-bold leading-none">{day.plan.startChapter}</span>
                    </div>
                )}

                {isFuture && !day.plan && (
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-lg">more_horiz</span>
                    </div>
                )}

                {isMissed && (
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-lg">schedule</span>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-50 to-green-50 dark:from-slate-900 dark:to-slate-800 relative overflow-x-hidden">
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

                <div className="flex justify-center gap-4">
                    <button onClick={() => navigateMonth('prev')} className="text-xs text-slate-400 hover:text-green-600 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">chevron_left</span>이전 달
                    </button>
                    <button onClick={() => navigateMonth('next')} className="text-xs text-slate-400 hover:text-green-600 font-medium flex items-center gap-1">
                        다음 달<span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </header>

            {/* Loading State */}
            {(isLoading || isGenerating) && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
                        <p className="text-sm text-slate-500">{isGenerating ? '읽기 계획 생성 중...' : '로딩 중...'}</p>
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            {!isLoading && !isGenerating && (
                <main className="relative z-10 px-4 pb-[500px]">
                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl rounded-[2rem] p-4 shadow-lg shadow-green-900/5 border border-white/50 dark:border-slate-700">
                        <div className="grid grid-cols-7 mb-4">
                            {WEEKDAYS.map((day, i) => (
                                <div key={day} className={`text-center text-[10px] font-bold uppercase tracking-wider py-2 ${i === 6 ? 'text-sky-500' : 'text-slate-400'}`}>
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                            {calendarDays.map((day, index) => renderDayCell(day, index))}
                        </div>
                    </div>
                </main>
            )}

            {/* Bottom Sheet - Stats */}
            <div className="fixed bottom-0 left-0 right-0 z-40">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-t-[2.5rem] p-6 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-white/50 dark:border-slate-800">
                    <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-green-50/50 dark:bg-green-900/20 p-4 rounded-3xl flex flex-col items-start relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10">
                                <span className="material-symbols-outlined text-6xl text-green-600">local_fire_department</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-green-500 mb-3 shadow-sm">
                                <span className="material-symbols-outlined text-xl">local_fire_department</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-green-700 dark:text-green-400 tracking-wider mb-0.5">연속 읽기</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {stats?.currentStreak || 0} <span className="text-sm font-medium text-slate-500">일</span>
                            </p>
                        </div>

                        <div className="bg-sky-50/50 dark:bg-sky-900/20 p-4 rounded-3xl flex flex-col items-start relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-3 opacity-10">
                                <span className="material-symbols-outlined text-6xl text-sky-600">menu_book</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sky-500 mb-3 shadow-sm">
                                <span className="material-symbols-outlined text-xl">menu_book</span>
                            </div>
                            <p className="text-[10px] uppercase font-bold text-sky-700 dark:text-sky-400 tracking-wider mb-0.5">진행률</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {stats?.progressPercent || 0}<span className="text-sm font-medium text-slate-500">%</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between px-2">
                        <button onClick={() => setShowSetupModal(true)} className="flex items-center gap-2 text-slate-400 hover:text-green-600 transition-colors">
                            <span className="material-symbols-outlined text-xl">tune</span>
                            <span className="text-xs font-semibold">설정</span>
                        </button>

                        <button
                            onClick={() => todayAssignment && handleStartReading(todayAssignment)}
                            disabled={!todayAssignment}
                            className="bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {todayAssignment ? `${todayAssignment.shortText || todayAssignment.book} 읽기` : '오늘 읽기 완료!'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Day Detail Popup */}
            <AnimatePresence>
                {selectedDay && selectedDay.plan && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedDay(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white dark:bg-slate-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
                        >
                            {/* Day Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${selectedDay.status === 'completed' ? 'text-green-600' :
                                        selectedDay.status === 'today' ? 'text-emerald-600' :
                                            selectedDay.status === 'missed' ? 'text-amber-600' : 'text-slate-400'
                                        }`}>
                                        {selectedDay.status === 'completed' ? '✓ 완료' :
                                            selectedDay.status === 'today' ? '오늘' :
                                                selectedDay.status === 'missed' ? '밀린 읽기' : '예정'}
                                    </span>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                                        Day {selectedDay.plan.dayNumber}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedDay(null)}
                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            {/* Reading Range */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-green-600 shadow-sm">
                                        <span className="material-symbols-outlined text-2xl">menu_book</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">읽기 범위</p>
                                        <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                                            {selectedDay.plan.displayText || `${selectedDay.plan.book} ${selectedDay.plan.startChapter}장`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                                    <span className="material-symbols-outlined text-slate-400 text-xl mb-1">schedule</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">예상 시간</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                                        {selectedDay.plan.estimatedTimeMinutes || 10}분
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                                    <span className="material-symbols-outlined text-slate-400 text-xl mb-1">text_fields</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">단어 수</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-white">
                                        {selectedDay.plan.wordCount ? `${Math.round(selectedDay.plan.wordCount / 1000)}k` : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            {selectedDay.status !== 'completed' && (
                                <button
                                    onClick={() => {
                                        handleStartReading(selectedDay.plan!);
                                        setSelectedDay(null);
                                    }}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-500/30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <span>읽기 시작</span>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            )}

                            {selectedDay.status === 'completed' && (
                                <div className="text-center py-3 text-green-600 font-medium flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    완료된 읽기입니다
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            <h2 className="text-xl font-bold text-center mb-2">📖 1년 성경 완독 계획</h2>
                            <p className="text-sm text-slate-500 text-center mb-6">창세기부터 요한계시록까지 순서대로!</p>

                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">역본 선택</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setSelectedMode('NKRV')}
                                        className={`p-3 rounded-xl border-2 transition-all ${selectedMode === 'NKRV' ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
                                    >
                                        <p className="font-bold text-sm">개역개정</p>
                                        <p className="text-[10px] text-slate-400">인지 부하 고려</p>
                                    </button>
                                    <button
                                        onClick={() => setSelectedMode('EASY')}
                                        className={`p-3 rounded-xl border-2 transition-all ${selectedMode === 'EASY' ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}
                                    >
                                        <p className="font-bold text-sm">쉬운성경</p>
                                        <p className="text-[10px] text-slate-400">흐름 중심 읽기</p>
                                    </button>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">하루 목표 시간</p>
                                <div className="flex gap-2">
                                    {[5, 10, 15, 20].map((min) => (
                                        <button
                                            key={min}
                                            onClick={() => setTargetMinutes(min)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${targetMinutes === min ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                        >
                                            {min}분
                                        </button>
                                    ))}
                                </div>
                            </div>

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
                                <button onClick={() => setShowSetupModal(false)} className="w-full mt-3 text-slate-400 text-sm font-medium">
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
