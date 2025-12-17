'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 목표 설정
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(1); // 일일 읽기 목표 (장)
  const [savedGoal, setSavedGoal] = useState(1);

  // 성경 전체 장 수 (1189장)
  const TOTAL_BIBLE_CHAPTERS = 1189;

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. 사용자의 읽기 기록 조회
      const { data: readings } = await supabase
        .from('reading_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 2. 일일 읽기 기록 조회 (streak 계산용)
      const { data: dailyReadings } = await supabase
        .from('daily_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('reading_date', { ascending: false });

      // 3. 셀 멤버의 진행률 조회
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

        // 멤버별 읽은 장 수 집계
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

      // 통계 계산
      const totalChapters = readings?.length || 0;
      const totalVerses = totalChapters * 25; // 평균 25절
      const completionPercent = Math.round((totalChapters / TOTAL_BIBLE_CHAPTERS) * 100);

      // 총 읽기 시간 계산
      const totalMinutes = dailyReadings?.reduce((acc: number, r: { minutes_read?: number }) => acc + (r.minutes_read || 0), 0) || 0;

      // Streak 계산
      const streak = calculateStreak(dailyReadings || []);

      // 주간 활동 계산
      const weekly = calculateWeeklyActivity(dailyReadings || []);

      // 월간 캘린더 데이터 계산
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
  const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

  // 원형 차트 계산
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (stats.completionPercent / 100) * circumference;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ios-bg-light dark:bg-ios-bg-dark">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-ios-bg-light dark:bg-ios-bg-dark text-slate-900 dark:text-white antialiased transition-colors duration-200">
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-ios-bg-light dark:bg-ios-bg-dark pb-28 overflow-x-hidden">

        <div className="flex items-center justify-between px-4 py-2 sticky top-0 z-30 bg-ios-bg-light/80 dark:bg-ios-bg-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
          <button
            onClick={() => navigate(Screen.DASHBOARD)}
            className="flex items-center gap-1 text-ios-blue active:opacity-60 transition-opacity"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
            <span className="text-[17px] leading-none -ml-1">뒤로</span>
          </button>
          <span className="text-[17px] font-semibold text-center">내 진행률</span>
          <button className="flex items-center justify-center text-ios-blue active:opacity-60 transition-opacity" onClick={fetchProgressData}>
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </div>

        <div className="flex flex-col gap-5 px-4 pt-4">
          {/* Header with Streak */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <h1 className="text-[34px] font-bold tracking-tight leading-tight text-gray-900 dark:text-white">진행 현황</h1>
              <div className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm bg-primary flex items-center justify-center text-white font-bold">
                {profile?.name?.charAt(0) || '?'}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-ios-card-dark p-3 rounded-2xl shadow-ios">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-ios-orange">
                <span className="material-symbols-outlined filled">local_fire_department</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">연속 읽기</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.streak > 0 ? `${stats.streak}일 연속으로 읽고 있어요! 🔥` : '오늘 첫 장을 읽어보세요!'}
                </p>
              </div>
            </div>
          </div>

          {/* Completion Chart */}
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-6 shadow-ios flex flex-col items-center justify-center relative overflow-hidden">
            <div className="flex justify-between w-full mb-4 items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">성경 통독</h2>
              <span className="text-sm font-medium text-gray-400">{TOTAL_BIBLE_CHAPTERS}장 중</span>
            </div>
            <div className="relative size-48">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-gray-100 dark:text-gray-800" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></circle>
                <defs>
                  <linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#34C759"></stop>
                    <stop offset="100%" stopColor="#32ADE6"></stop>
                  </linearGradient>
                </defs>
                <circle
                  className="drop-shadow-[0_0_4px_rgba(52,199,89,0.3)]"
                  cx="50" cy="50" fill="none" r="42"
                  stroke="url(#gradient)"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="8"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">
                  {stats.completionPercent}<span className="text-xl align-top text-gray-400">%</span>
                </span>
                <span className="text-xs text-gray-500">{stats.totalChapters}장 읽음</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center px-4 font-medium">
              {stats.completionPercent === 0 ? '성경 읽기를 시작해보세요!' :
                stats.completionPercent < 25 ? '좋은 시작이에요! 계속 읽어보세요.' :
                  stats.completionPercent < 50 ? '잘 하고 있어요! 절반에 가까워지고 있어요.' :
                    stats.completionPercent < 75 ? '대단해요! 절반을 넘었어요!' :
                      stats.completionPercent < 100 ? '거의 다 왔어요! 조금만 더!' :
                        '축하합니다! 성경 통독을 완료했어요! 🎉'}
            </p>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[20px] p-4 shadow-ios flex flex-col justify-between h-36">
              <div className="flex items-start justify-between">
                <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-full text-ios-blue">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
              </div>
              <div>
                <span className="text-3xl font-bold block text-gray-900 dark:text-white">
                  {Math.floor(stats.totalMinutes / 60)}<span className="text-lg text-gray-400 font-medium ml-0.5">시간</span>
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 block">총 읽기 시간</span>
              </div>
            </div>
            <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[20px] p-4 shadow-ios flex flex-col justify-between h-36">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-full text-purple-500">
                  <span className="material-symbols-outlined text-xl">menu_book</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-1">
                <div>
                  <span className="text-xl font-bold block leading-none text-gray-900 dark:text-white">{stats.totalChapters}</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">장</span>
                </div>
                <div className="w-full h-px bg-gray-100 dark:bg-gray-700/50"></div>
                <div>
                  <span className="text-xl font-bold block leading-none text-gray-900 dark:text-white">{stats.totalVerses}</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">절 (추정)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-5 shadow-ios">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">주간 활동</h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">최근 7일</span>
            </div>
            <div className="flex items-end justify-between h-32 gap-3">
              {weeklyActivity.map((value, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-full relative overflow-hidden">
                    <div
                      className={`absolute bottom-0 w-full rounded-full transition-colors ${value > 0 ? 'bg-primary shadow-[0_0_10px_rgba(52,199,89,0.3)]' : 'bg-gray-200 dark:bg-gray-700'}`}
                      style={{ height: value > 0 ? `${(value / getMaxActivity()) * 100}%` : '5%' }}
                    ></div>
                  </div>
                  <span className={`text-[10px] font-semibold ${value > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'}`}>
                    {dayLabels[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cell Leaderboard */}
          {cellLeaderboard.length > 0 && (
            <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-5 shadow-ios mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">🏆 셀 리더보드</h3>
              </div>
              <div className="flex flex-col gap-3">
                {cellLeaderboard.map((member, idx) => (
                  <div key={member.user_id} className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                      {idx + 1}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {member.user_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.user_name}
                        {member.user_id === user?.id && <span className="text-xs text-primary ml-1">(나)</span>}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary">{member.chapters_count}장</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awards */}
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-5 shadow-ios mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">🏅 업적</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
              <div className={`flex flex-col items-center gap-2 min-w-[76px] ${stats.streak >= 7 ? '' : 'opacity-40'}`}>
                <div className="size-[68px] rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">local_fire_department</span>
                </div>
                <span className="text-[10px] font-semibold text-center text-gray-600 dark:text-gray-300">7일 연속</span>
              </div>
              <div className={`flex flex-col items-center gap-2 min-w-[76px] ${stats.totalChapters >= 50 ? '' : 'opacity-40'}`}>
                <div className="size-[68px] rounded-full bg-gradient-to-b from-green-400 to-green-700 shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">auto_stories</span>
                </div>
                <span className="text-[10px] font-semibold text-center text-gray-600 dark:text-gray-300">50장 읽기</span>
              </div>
              <div className={`flex flex-col items-center gap-2 min-w-[76px] ${stats.completionPercent >= 50 ? '' : 'opacity-40'}`}>
                <div className="size-[68px] rounded-full bg-gradient-to-b from-blue-300 to-blue-600 shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-3xl">emoji_events</span>
                </div>
                <span className="text-[10px] font-semibold text-center text-gray-600 dark:text-gray-300">절반 통독</span>
              </div>
            </div>
          </div>

          {/* Monthly Attendance Calendar */}
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-5 shadow-ios mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">📅 이번 달 출석</h3>
              <span className="text-sm text-primary font-semibold">{monthlyReadDays.size}일</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <span key={d} className="text-[10px] text-gray-400 font-semibold py-1">{d}</span>
              ))}
              {(() => {
                const now = new Date();
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const today = now.getDate();
                const cells = [];

                // Empty cells for days before first of month
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="h-8"></div>);
                }

                // Days of the month
                for (let day = 1; day <= daysInMonth; day++) {
                  const isRead = monthlyReadDays.has(day);
                  const isToday = day === today;
                  cells.push(
                    <div
                      key={day}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto
                        ${isRead ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400'}
                        ${isToday && !isRead ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' : ''}
                      `}
                    >
                      {day}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          </div>

          {/* Goal Setting Card */}
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-5 shadow-ios mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">🎯 일일 목표</h3>
              <button
                onClick={() => setShowGoalModal(true)}
                className="text-primary text-sm font-semibold"
              >
                수정
              </button>
            </div>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">매일 읽기 목표</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{savedGoal}장</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">오늘 진행률</p>
                <p className="text-lg font-bold text-primary">
                  {weeklyActivity[6] >= savedGoal ? '완료! ✅' : `${weeklyActivity[6]}/${savedGoal}`}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Goal Setting Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">일일 목표 설정</h2>
              <button onClick={() => setShowGoalModal(false)} className="text-gray-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                하루에 몇 장을 읽으실 건가요?
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center text-2xl"
                >
                  -
                </button>
                <span className="text-4xl font-bold text-gray-900 dark:text-white w-16 text-center">{dailyGoal}</span>
                <button
                  onClick={() => setDailyGoal(dailyGoal + 1)}
                  className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center text-2xl"
                >
                  +
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">장 / 일</p>
            </div>
            <button
              onClick={() => {
                setSavedGoal(dailyGoal);
                setShowGoalModal(false);
              }}
              className="w-full bg-primary text-white py-3 rounded-xl font-medium"
            >
              저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressScreen;