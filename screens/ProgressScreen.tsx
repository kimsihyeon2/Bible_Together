'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

interface ProgressScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

interface CellMemberProgress {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  chapters_count: number;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigate, t }) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalChapters: 0,
    totalVerses: 0,
    totalMinutes: 0,
    streak: 0,
    completionPercent: 0,
  });
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [cellLeaderboard, setCellLeaderboard] = useState<CellMemberProgress[]>([]);

  // 월간 캘린더 데이터 (Monthly Calendar Data)
  const [monthlyReadDays, setMonthlyReadDays] = useState<Set<number>>(new Set());

  // 목표 설정 - Persistent
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [savedGoal, setSavedGoal] = useState(1);

  // 성경 전체 장 수 (1189장)
  const TOTAL_BIBLE_CHAPTERS = 1189;

  useEffect(() => {
    // Load saved goal
    const saved = localStorage.getItem('dailyGoal');
    if (saved) {
      setSavedGoal(parseInt(saved, 10));
      setDailyGoal(parseInt(saved, 10));
    }
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch RAW Reading Activities (Source of Truth)
      const { data: activities, error } = await supabase
        .from('reading_activities')
        .select('created_at, chapters_read, minutes_read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 2. Client-side Aggregation (SOTA Accuracy)
      // Group by Local Date string 'YYYY-MM-DD'
      const dailyMap = new Map<string, number>();

      activities?.forEach((act: any) => {
        // Convert UTC to Local Date String
        const date = new Date(act.created_at);
        // Use user's local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;

        const count = dailyMap.get(localDateStr) || 0;
        dailyMap.set(localDateStr, count + 1);
      });

      // 3. Calculate Totals
      const totalChapters = activities?.length || 0;
      const totalVerses = totalChapters * 25; // Approx
      // Estimate minutes: 5 mins per chapter as heuristic + explicit field if exists
      const totalMinutes = activities?.reduce((acc: number, curr: any) => {
        return acc + (curr.minutes_read || 5);
      }, 0) || 0;

      const completionPercent = Math.min(100, Math.round((totalChapters / TOTAL_BIBLE_CHAPTERS) * 100));

      // 4. Calculate Streak
      const streak = calculateStreak(dailyMap);

      // 5. Calculate Weekly Activity (Last 7 Days)
      const weekly = calculateWeeklyActivity(dailyMap);

      // 6. Monthly Data
      const readDays = new Set<number>();
      const now = new Date();
      dailyMap.forEach((_, dateStr) => {
        const d = new Date(dateStr);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          readDays.add(d.getDate());
        }
      });
      setMonthlyReadDays(readDays);

      setStats({
        totalChapters,
        totalVerses,
        totalMinutes,
        streak,
        completionPercent,
      });
      setWeeklyActivity(weekly);

      // 7. Cell Leaderboard Logic
      const { data: cellMembership } = await supabase
        .from('cell_members')
        .select('cell_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cellMembership) {
        const { data: cellReadings } = await supabase
          .from('reading_activities')
          .select('user_id, user_name')
          .eq('cell_id', cellMembership.cell_id);

        if (cellReadings) {
          const memberCounts: { [key: string]: { name: string; count: number } } = {};
          cellReadings.forEach((r: { user_id: string; user_name: string | null }) => {
            if (!memberCounts[r.user_id]) {
              memberCounts[r.user_id] = { name: r.user_name || '익명', count: 0 };
            }
            memberCounts[r.user_id].count++;
          });

          const leaderboard = Object.entries(memberCounts)
            .map(([userId, data]) => ({
              user_id: userId,
              user_name: data.name,
              avatar_url: null,
              chapters_count: data.count,
            }))
            .sort((a, b) => b.chapters_count - a.chapters_count)
            .slice(0, 5);

          setCellLeaderboard(leaderboard);
        }
      }

      // Check Goal Completion & Trigger Confetti (Last day of weekly array is Today)
      if (weekly[6] >= savedGoal && weekly[6] > 0) {
        const todayStr = new Date().toDateString();
        const hasCelebrated = localStorage.getItem(`celebrated_${todayStr}`);
        if (!hasCelebrated) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#4ade80', '#3b82f6', '#f59e0b'],
            zIndex: 9999,
          });
          localStorage.setItem(`celebrated_${todayStr}`, 'true');
        }
      }

    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dailyMap: Map<string, number>) => {
    let streak = 0;
    const today = new Date();

    // Check backwards from today
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (dailyMap.has(dateStr)) {
        streak++;
      } else if (i === 0) {
        // If today is missing, streak might still be alive from yesterday
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateWeeklyActivity = (dailyMap: Map<string, number>) => {
    const weekly = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i)); // -6 (6 days ago) to -0 (Today)

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      weekly[i] = dailyMap.get(dateStr) || 0;
    }
    return weekly;
  };

  const getMaxActivity = () => Math.max(...weeklyActivity, 5); // Minimum scale of 5 for visuals

  // Rotate labels to end with today
  const getDynamicDayLabels = () => {
    const labels = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Get short day name (e.g., 'M', 'T')
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
      labels.push(dayName);
    }
    return labels;
  };
  const dynamicLabels = getDynamicDayLabels();

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (stats.completionPercent / 100) * circumference;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased min-h-screen pb-32 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">

      {/* Background Decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-green-100/40 dark:bg-green-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 sticky top-0 bg-[#f8fafc]/80 dark:bg-slate-950/80 backdrop-blur-xl z-30">
          <button
            onClick={() => navigate(Screen.DASHBOARD)}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="text-base font-bold text-slate-800 dark:text-white">{t.progress.title}</span>
          <button
            onClick={fetchProgressData}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>

        <div className="flex flex-col gap-6 px-5 pt-4">

          {/* Main Title & Streak */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end px-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col"
              >
                <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-1">Hello, {profile?.name || 'Believer'}</span>
                <h1 className="text-3xl font-[800] tracking-tight text-slate-900 dark:text-white leading-tight">
                  Your Spiritual<br />
                  <span className="text-indigo-600 dark:text-indigo-400">Growth Journey</span>
                </h1>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-5 bg-white dark:bg-slate-900 p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-800"
            >
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl text-orange-500">
                <span className="material-symbols-outlined text-3xl filled animate-pulse">local_fire_department</span>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-[900] text-slate-900 dark:text-white tabular-nums">{stats.streak}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Days Streak</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                  {stats.streak > 0 ? "You're on fire! Keep it up!" : "Start your streak today!"}
                </p>
              </div>
            </motion.div>
          </div>

          {/* SOTA Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-44 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-blue-500">schedule</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2">
                <span className="material-symbols-outlined text-2xl">schedule</span>
              </div>
              <div>
                <span className="text-4xl font-[900] text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {Math.floor(stats.totalMinutes / 60)}<span className="text-xl text-slate-400 ml-0.5">h</span>
                  <span className="text-2xl text-slate-900 dark:text-white ml-2">{stats.totalMinutes % 60}<span className="text-base text-slate-400 ml-0.5">m</span></span>
                </span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Total Time</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-between h-44 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-purple-500">menu_book</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2">
                <span className="material-symbols-outlined text-2xl">menu_book</span>
              </div>
              <div>
                <span className="text-4xl font-[900] text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {stats.totalChapters.toLocaleString()}
                </span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">Chapters Read</p>
              </div>
            </motion.div>
          </div>

          {/* Weekly Activity Chart (Infographic Style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-[800] text-slate-900 dark:text-white">Weekly Activity</h3>
                <p className="text-xs text-slate-400 font-medium">Last 7 days performance</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Live</span>
              </div>
            </div>

            <div className="flex items-end justify-between h-40 gap-3">
              {weeklyActivity.map((value, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 flex-1 group">
                  <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-full h-full relative overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700/50">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: value > 0 ? `${Math.max(15, (value / getMaxActivity()) * 100)}%` : '0%' }}
                      transition={{ type: "spring", stiffness: 100, damping: 20, delay: idx * 0.1 }}
                      className={`absolute bottom-0 w-full rounded-full ${idx === 6 ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                    >
                      {value > 0 && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white/90">
                          {value}
                        </div>
                      )}
                    </motion.div>
                  </div>
                  <span className={`text-[11px] font-bold ${idx === 6 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                    {dynamicLabels[idx]}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Monthly Calendar (GitHub Style) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-[800] text-slate-900 dark:text-white">Consistency</h3>
              <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full">{monthlyReadDays.size} Days This Month</span>
            </div>
            <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>)}
              {(() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const today = now.getDate();
                const cells = [];

                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`e-${i}`} />);
                }
                for (let day = 1; day <= daysInMonth; day++) {
                  const isRead = monthlyReadDays.has(day);
                  const isToday = day === today;
                  cells.push(
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: day * 0.01 }}
                      key={day}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto transition-all ${isRead ? 'bg-green-500 text-white shadow-md shadow-green-500/30' :
                          isToday ? 'border-2 border-green-500 text-green-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                        }`}
                    >
                      {day}
                    </motion.div>
                  );
                }
                return cells;
              })()}
            </div>
          </motion.div>

          {/* Bible Completion Circular Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-indigo-600 dark:bg-indigo-900 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-200 dark:shadow-none text-white relative overflow-hidden"
          >
            {/* Background Patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="flex justify-between w-full mb-8 items-center relative z-10">
              <div>
                <h2 className="text-xl font-[800]">Bible Progress</h2>
                <p className="text-white/70 text-sm font-medium">Keep going!</p>
              </div>
              <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                {TOTAL_BIBLE_CHAPTERS.toLocaleString()} Chapters Total
              </span>
            </div>

            <div className="flex items-center gap-8 relative z-10">
              <div className="relative size-32 flex-shrink-0">
                <div className="relative size-32">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle className="text-black/10" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></circle>
                    <circle
                      className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      cx="50" cy="50" fill="none" r="42"
                      stroke="currentColor"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      strokeWidth="8"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-[900] tracking-tighter">
                      {stats.completionPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-white/60 mb-1">
                    <span>Old Testament</span>
                    <span>--/--</span>
                  </div>
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 w-[0%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-white/60 mb-1">
                    <span>New Testament</span>
                    <span>--/--</span>
                  </div>
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 w-[0%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Goal Setting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-[800] text-slate-900 dark:text-white">Daily Goal</h3>
              <button onClick={() => setShowGoalModal(true)} className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 px-4 py-2 rounded-full transition-colors">Edit Goal</button>
            </div>
            <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5">
              <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-green-500 shadow-sm text-2xl">
                <span className="material-symbols-outlined filled">flag</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Target</p>
                <p className="text-xl font-[800] text-slate-900 dark:text-white">{savedGoal} Chapters</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Today</p>
                <div className="flex items-baseline justify-end gap-1">
                  <span className={`text-2xl font-[900] ${weeklyActivity[6] >= savedGoal ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                    {weeklyActivity[6] >= savedGoal ? 'DONE' : weeklyActivity[6]}
                  </span>
                  {weeklyActivity[6] < savedGoal && <span className="text-sm font-bold text-slate-400">/{savedGoal}</span>}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl scale-100">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-[800] text-slate-900 dark:text-white">Set Daily Goal</h2>
              <button onClick={() => setShowGoalModal(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-8 mb-10">
              <p className="text-slate-500 text-base font-medium text-center">How many chapters do you want to read daily?</p>
              <div className="flex items-center gap-8">
                <button onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))} className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="text-6xl font-[900] text-slate-900 dark:text-white tabular-nums min-w-[3ch] text-center">{dailyGoal}</span>
                <button onClick={() => setDailyGoal(dailyGoal + 1)} className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-3xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setSavedGoal(dailyGoal);
                localStorage.setItem('dailyGoal', dailyGoal.toString());
                setShowGoalModal(false);
              }}
              className="w-full h-16 bg-indigo-600 text-white rounded-[1.8rem] font-bold text-xl shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Save Goal
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProgressScreen;