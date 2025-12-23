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

  // 월간 캘린더 데이터
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
      // 1. Fetch reading_activities - 개별 읽기 기록
      const { data: readings } = await supabase
        .from('reading_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Fetch daily_readings - 일별 집계 데이터
      const { data: dailyReadings } = await supabase
        .from('daily_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('reading_date', { ascending: false });

      // 3. Cell 멤버십 확인 & 리더보드
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
              memberCounts[r.user_id] = { name: r.user_name || t.progress.anonymous, count: 0 };
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

      // 통계 계산 - readings 기반 (실제 기록 수)
      const totalChapters = readings?.length || 0;
      const totalVerses = totalChapters * 25;
      const completionPercent = Math.min(100, Math.round((totalChapters / TOTAL_BIBLE_CHAPTERS) * 100));

      // 총 시간: dailyReadings에서 합산 또는 추정 (1장당 5분)
      const totalMinutes = dailyReadings?.reduce((acc: number, r: { minutes_read?: number }) =>
        acc + (r.minutes_read || 0), 0) || (totalChapters * 5);

      // 연속 기록 계산
      const streak = calculateStreak(dailyReadings || []);

      // 주간 활동 계산
      const weekly = calculateWeeklyActivity(dailyReadings || []);

      // 월간 달력 데이터
      const readDays = new Set<number>();
      const now = new Date();
      if (dailyReadings) {
        dailyReadings.forEach((r: { reading_date: string }) => {
          const date = new Date(r.reading_date);
          if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            readDays.add(date.getDate());
          }
        });
      }
      setMonthlyReadDays(readDays);

      setStats({
        totalChapters,
        totalVerses,
        totalMinutes,
        streak,
        completionPercent,
      });
      setWeeklyActivity(weekly);

      // 목표 달성 시 축하 효과
      if (weekly[6] >= savedGoal && weekly[6] > 0) {
        const hasCelebrated = localStorage.getItem(`celebrated_${new Date().toDateString()}`);
        if (!hasCelebrated) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#4ade80', '#22c55e', '#16a34a']
          });
          localStorage.setItem(`celebrated_${new Date().toDateString()}`, 'true');
        }
      }

    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dailyReadings: any[]) => {
    if (dailyReadings.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      const hasReading = dailyReadings.some((r) => r.reading_date === dateStr);
      if (hasReading) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  };

  const calculateWeeklyActivity = (dailyReadings: any[]) => {
    const weekly = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - (6 - i));
      const dateStr = checkDate.toISOString().split('T')[0];

      const reading = dailyReadings.find((r) => r.reading_date === dateStr);
      if (reading) {
        weekly[i] = reading.chapters_read || 1;
      }
    }

    return weekly;
  };

  const getMaxActivity = () => Math.max(...weeklyActivity, 1);
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (stats.completionPercent / 100) * circumference;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#e0f2fe] to-[#ecfccb] dark:from-slate-900 dark:to-slate-800">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#e0f2fe] to-[#ecfccb] dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-100 font-sans antialiased min-h-screen pb-32">
      <div className="relative flex flex-col h-full max-w-md mx-auto">

        {/* Header - 한국어 */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2 sticky top-0 z-30 backdrop-blur-sm">
          <button
            onClick={() => navigate(Screen.DASHBOARD)}
            className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="text-lg font-bold text-slate-800 dark:text-white">{t.progress.title}</span>
          <button
            onClick={fetchProgressData}
            className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>

        <div className="flex flex-col gap-5 px-4 pt-4">

          {/* 상태 메시지 - 한국어 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4 text-slate-600 dark:text-slate-300"
          >
            {stats.completionPercent === 0 ? t.progress.statusStart :
              stats.completionPercent < 25 ? t.progress.statusKeepGoing :
                stats.completionPercent < 50 ? t.progress.statusAmazing :
                  stats.completionPercent < 75 ? t.progress.statusHalfway :
                    stats.completionPercent < 100 ? t.progress.statusAlmost :
                      t.progress.statusCompleted}
          </motion.div>

          {/* 통계 그리드 - 한국어 */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{Math.floor(stats.totalMinutes / 60)}<span className="text-lg text-slate-400 ml-1">h</span></span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{t.progress.totalTime}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-32"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
                <span className="material-symbols-outlined">menu_book</span>
              </div>
              <div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalChapters}</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mt-1">{t.progress.totalChapters}</p>
              </div>
            </motion.div>
          </div>

          {/* 주간 활동 - 한국어 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.progress.weeklyActivity}</h3>
              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded-lg">{t.progress.last7Days}</span>
            </div>
            <div className="flex items-end justify-between h-32 gap-3">
              {weeklyActivity.map((value, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-full relative overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: value > 0 ? `${(value / getMaxActivity()) * 100}%` : '4px' }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      className={`absolute bottom-0 w-full rounded-full transition-all ${value > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(74,222,128,0.4)]' : 'bg-transparent'}`}
                    ></motion.div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{dayLabels[idx]}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 셀 리더보드 - 한국어 */}
          {cellLeaderboard.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t.progress.cellLeaderboard}</h3>
              <div className="space-y-4">
                {cellLeaderboard.map((member, idx) => (
                  <div key={member.user_id} className="flex items-center gap-4">
                    <span className={`text-base font-bold w-4 text-center ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-700' : 'text-slate-300'}`}>{idx + 1}</span>
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-bold">
                      {member.user_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {member.user_name}
                        {member.user_id === user?.id && <span className="text-xs text-green-500 ml-1">{t.progress.you}</span>}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{member.chapters_count} {t.progress.chapters}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* 월간 캘린더 - 한국어 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.progress.consistency}</h3>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">{monthlyReadDays.size} {t.progress.days}</span>
            </div>
            <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-[10px] font-bold text-slate-400">{d}</span>)}
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
                    <div key={day} className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto transition-all ${isRead ? 'bg-green-500 text-white shadow-md shadow-green-500/30' :
                      isToday ? 'border-2 border-green-500 text-green-600' : 'text-slate-400'
                      }`}>
                      {day}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </motion.div>

          {/* 일일 목표 - 한국어 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-700 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.progress.dailyGoal}</h3>
              <button onClick={() => setShowGoalModal(true)} className="text-xs font-bold text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors">{t.progress.edit}</button>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-[1.5rem]">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center text-green-500 shadow-sm">
                <span className="material-symbols-outlined">flag</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">{t.progress.target}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{savedGoal} {t.progress.chapters}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs font-bold text-slate-400 uppercase">{t.progress.today}</p>
                <p className="text-lg font-bold text-green-600">
                  {weeklyActivity[6] >= savedGoal ? t.progress.done : `${weeklyActivity[6]}/${savedGoal}`}
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 목표 설정 모달 - 한국어 */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.progress.setDailyGoalTitle}</h2>
              <button onClick={() => setShowGoalModal(false)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 mb-8">
              <p className="text-slate-500 text-sm font-medium">{t.progress.howManyChapters}</p>
              <div className="flex items-center gap-6">
                <button onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))} className="w-14 h-14 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-2xl text-slate-400 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="text-5xl font-bold text-slate-900 dark:text-white tabular-nums">{dailyGoal}</span>
                <button onClick={() => setDailyGoal(dailyGoal + 1)} className="w-14 h-14 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center text-2xl text-slate-400 hover:bg-slate-50 transition-colors">
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
              className="w-full h-14 bg-green-500 text-white rounded-[1.5rem] font-bold text-lg shadow-lg shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.progress.saveGoal}
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default ProgressScreen;