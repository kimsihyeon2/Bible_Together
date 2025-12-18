'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { UrgentPrayerList, CreateUrgentPrayerModal } from '@/components/UrgentPrayer';
import { supabase } from '@/lib/supabase';

interface DashboardScreenProps {
  navigate: (screen: Screen) => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
  t: Translations;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigate, isDarkMode, toggleDarkMode, t }) => {
  const { user, profile, isAdmin } = useAuth();
  const [showUrgentPrayers, setShowUrgentPrayers] = useState(false);
  const [showCreatePrayer, setShowCreatePrayer] = useState(false);
  const [urgentPrayerCount, setUrgentPrayerCount] = useState(0);
  const [userStats, setUserStats] = useState({
    streak: 0,
    todayRead: false,
    planDay: 0,
    planTotal: 30,
    planName: '',
    todayReading: '',
    planImage: '',
    planId: '',
  });
  const [activePlans, setActivePlans] = useState<any[]>([]);
  const [hasCell, setHasCell] = useState(true);

  // Get user's first name
  const getUserName = () => {
    if (profile?.name) {
      return profile.name.split(' ')[0];
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return '사용자';
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.dashboard.greeting; // 좋은 아침이에요
    if (hour < 18) return '좋은 오후예요,';
    return '좋은 저녁이에요,';
  };

  // Fetch urgent prayer count and user stats
  useEffect(() => {
    const fetchData = async () => {
      // Urgent prayers count -> Notifications count
      if (user) {
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (notifications) {
          setUrgentPrayerCount(notifications.length);
        }
      }

      // User stats
      if (user) {
        // Check cell membership
        const { data: cellMembership } = await supabase
          .from('cell_members')
          .select('cell_id')
          .eq('user_id', user.id)
          .maybeSingle();
        setHasCell(!!cellMembership);

        // Daily readings for streak
        const { data: dailyReadings } = await supabase
          .from('daily_readings')
          .select('reading_date')
          .eq('user_id', user.id)
          .order('reading_date', { ascending: false });

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        const todayRead = dailyReadings?.some((r: { reading_date: string }) => r.reading_date === todayStr) || false;

        if (dailyReadings) {
          for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            if (dailyReadings.some((r: { reading_date: string }) => r.reading_date === dateStr)) {
              streak++;
            } else if (i > 0) break;
          }
        }

        // Reading plan progress
        const { data: planProgress } = await supabase
          .from('user_reading_progress')
          .select('id, current_day, reading_plans(id, name, total_days, cover_image_url)')
          .eq('user_id', user.id)
          .eq('completed', false);

        if (planProgress && planProgress.length > 0) {
          setActivePlans(planProgress);

          const mainPlanProgress = planProgress[0];
          const readingPlan = mainPlanProgress.reading_plans as any;

          // 오늘 읽을 장 계산 (요한복음 1장부터 시작)
          const currentDay = mainPlanProgress.current_day || 1;
          const todayReadingText = readingPlan?.name ? `${readingPlan.name.split(' ')[0]} ${currentDay}장` : '요한복음 1장';

          setUserStats({
            streak,
            todayRead,
            planDay: currentDay,
            planTotal: readingPlan?.total_days || 30,
            planName: readingPlan?.name || '읽기 플랜 시작하기',
            todayReading: todayReadingText,
            planImage: readingPlan?.cover_image_url || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
            planId: readingPlan?.id || '',
          });
        } else {
          setUserStats({
            streak,
            todayRead,
            planDay: 0,
            planTotal: 30,
            planName: '진행 중인 플랜 없음',
            todayReading: '플랜을 시작해보세요',
            planImage: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
            planId: '',
          });
        }
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="relative min-h-screen w-full pb-32 bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-white antialiased selection:bg-primary/30">
      <header className="sticky top-0 z-40 glass-nav border-b border-black/5 dark:border-white/10 transition-all duration-300">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">{t.dashboard.cellName}</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t.dashboard.communityTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Urgent Prayer Bell */}
            <button
              onClick={() => setShowUrgentPrayers(true)}
              className="relative rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-[24px] text-slate-900 dark:text-white">notifications</span>
              {urgentPrayerCount > 0 && (
                <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-black">
                  {urgentPrayerCount}
                </span>
              )}
            </button>
            <button
              onClick={toggleDarkMode}
              className="relative rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              <span className="material-symbols-outlined text-[24px] text-slate-900 dark:text-white">
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            {/* Admin Button - Only for PASTOR/LEADER */}
            {isAdmin && (
              <button
                onClick={() => navigate(Screen.ADMIN)}
                className="rounded-xl px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                관리자
              </button>
            )}
            <button
              onClick={() => navigate(Screen.SETTINGS)}
              className="h-9 w-9 overflow-hidden rounded-full bg-primary flex items-center justify-center text-white font-bold"
            >
              {getUserName().charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-6 pt-4">
        {/* Greeting with dynamic user name */}
        <div className="px-5">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {getGreeting()}<br />{getUserName()}
          </h2>
          <p className="mt-2 text-[15px] font-medium text-slate-500 dark:text-slate-400">{t.dashboard.readyMessage}</p>
        </div>

        {/* Personal Stats Cards */}
        <div className="px-5">
          <div className="grid grid-cols-3 gap-3">
            {/* Streak */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm flex flex-col items-center">
              <span className="material-symbols-outlined text-ios-orange text-2xl mb-1">local_fire_department</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{userStats.streak}</span>
              <span className="text-[10px] text-slate-500">연속 일수</span>
            </div>
            {/* Today Status */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm flex flex-col items-center">
              <span className={`material-symbols-outlined text-2xl mb-1 ${userStats.todayRead ? 'text-primary' : 'text-slate-300'}`}>
                {userStats.todayRead ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{userStats.todayRead ? '완료!' : '읽기 전'}</span>
              <span className="text-[10px] text-slate-500">오늘의 읽기</span>
            </div>
            {/* Plan Progress */}
            <div
              className="bg-surface-light dark:bg-surface-dark rounded-2xl p-3 shadow-sm flex flex-col items-center cursor-pointer active:scale-95"
              onClick={() => navigate(Screen.PLAN_DETAIL)}
            >
              <span className="material-symbols-outlined text-ios-blue text-2xl mb-1">menu_book</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {userStats.planDay > 0 ? `${userStats.planDay}/${userStats.planTotal}` : '시작'}
              </span>
              <span className="text-[10px] text-slate-500">읽기 플랜</span>
            </div>
          </div>
        </div>

        {/* Cell Join Alert */}
        {!hasCell && (
          <div className="px-5">
            <div
              onClick={() => navigate(Screen.SETTINGS)}
              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3 cursor-pointer"
            >
              <span className="material-symbols-outlined text-amber-500 text-3xl">group_add</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">셀에 가입하세요!</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">셀에 가입하면 함께 성경을 읽을 수 있어요</p>
              </div>
              <span className="material-symbols-outlined text-amber-400">chevron_right</span>
            </div>
          </div>
        )}

        {/* Admin: Create Urgent Prayer Button */}
        {isAdmin && (
          <div className="px-5">
            <button
              onClick={() => setShowCreatePrayer(true)}
              className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <span className="material-symbols-outlined">priority_high</span>
              긴급 기도 요청 보내기
            </button>
          </div>
        )}

        {/* Daily Reading Card */}
        <div className="px-5 cursor-pointer" onClick={() => navigate(Screen.PLAN_DETAIL)}>
          <div className="group relative overflow-hidden rounded-[2rem] bg-surface-light dark:bg-surface-dark shadow-ios-lg transition-transform active:scale-[0.98]">
            <div className="relative h-64 w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
              <img alt="Bible Reading" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" src={userStats.planImage} />
              <div className="absolute top-4 left-4 z-20">
                <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-md border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t.dashboard.todaysReading}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{userStats.todayReading}</h3>
                    <p className="mt-1 text-sm font-medium text-white/90">{t.dashboard.day} {userStats.planDay} • {userStats.planName}</p>
                  </div>
                  <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform hover:scale-110 active:scale-95">
                    <span className="material-symbols-outlined font-bold">play_arrow</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-5 grid grid-cols-2 gap-4">
          <div className="rounded-3xl bg-surface-light dark:bg-surface-dark p-5 shadow-ios flex flex-col justify-between h-40 relative overflow-hidden" onClick={() => navigate(Screen.PROGRESS)}>
            <div className="flex flex-col z-10">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.dashboard.goal}</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">75%</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t.dashboard.groupProgress}</span>
            </div>
            <div className="absolute -bottom-4 -right-4 h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                <path className="text-primary drop-shadow-[0_0_8px_rgba(52,199,89,0.4)]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="4"></path>
              </svg>
            </div>
          </div>
          <div className="rounded-3xl bg-surface-light dark:bg-surface-dark p-5 shadow-ios flex flex-col justify-between h-40">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t.dashboard.streak}</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{userStats.streak} {t.dashboard.days}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t.dashboard.personalBest}</span>
            </div>
            <div className="flex items-center gap-1 mt-auto">
              <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-500 text-lg">local_fire_department</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Plans */}
        <div className="flex flex-col gap-4">
          <div className="px-5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t.dashboard.activePlans}</h3>
            <button className="text-sm font-medium text-primary hover:text-green-500 transition-colors">{t.dashboard.seeAll}</button>
          </div>
          <div className="flex overflow-x-auto px-5 pb-6 gap-4 scrollbar-hide snap-x snap-mandatory no-scrollbar">
            {activePlans.length > 0 ? (
              activePlans.map((progress) => {
                const plan = progress.reading_plans;
                const percent = Math.round((progress.current_day / plan.total_days) * 100);

                return (
                  <div
                    key={progress.id}
                    className="snap-center shrink-0 w-44 flex flex-col gap-2 group cursor-pointer"
                    onClick={() => {
                      // 선택된 플랜으로 이동하기 전에 필요한 설정 저장
                      // 여기서는 일단 단순히 이동만 함. PlanDetailScreen에서 로직 보강 필요.
                      // 하지만 PlanDetailScreen은 현재 단일 플랜(요한복음) 위주로 되어 있음.
                      // 추후 PlanDetailScreen을 id 기반으로 수정해야 함.
                      localStorage.setItem('selectedPlanId', plan.id);
                      navigate(Screen.PLAN_DETAIL);
                    }}
                  >
                    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                      <img alt={plan.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" src={plan.cover_image_url || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800'} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white leading-tight">{plan.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{plan.total_days - progress.current_day}일 남음</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="snap-center shrink-0 w-full flex items-center justify-center py-8 text-slate-500">
                진행 중인 플랜이 없습니다.
              </div>
            )}

            <div className="snap-center shrink-0 w-44 flex flex-col gap-2">
              <button
                onClick={() => navigate(Screen.BIBLE)} // 일단 성경 화면으로 이동, 추후 커뮤니티나 플랜 찾기 화면으로 변경
                className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">add</span>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.dashboard.findPlan}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t.dashboard.quickActions}</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: 'favorite', label: t.dashboard.prayer, color: 'text-pink-500', action: () => setShowUrgentPrayers(true) },
              { icon: 'forum', label: t.dashboard.chat, color: 'text-indigo-500', action: () => navigate(Screen.CHAT) },
              { icon: 'menu_book', label: '성경', color: 'text-orange-500', action: () => navigate(Screen.PLAN_DETAIL) },
              { icon: 'settings', label: t.dashboard.settings, color: 'text-slate-500', action: () => navigate(Screen.SETTINGS) }
            ].map((action, i) => (
              <button key={i} onClick={action.action} className="flex flex-col items-center gap-2 group">
                <div className="h-16 w-16 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-ios flex items-center justify-center transition-transform group-active:scale-95 group-hover:bg-slate-50 dark:group-hover:bg-white/5">
                  <span className={`material-symbols-outlined ${action.color} text-2xl`}>{action.icon}</span>
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Latest Activity */}
        <div className="px-5 mb-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t.dashboard.latestActivity}</h3>
          <div className="rounded-2xl bg-surface-light dark:bg-surface-dark shadow-ios overflow-hidden">
            <div className="flex items-start gap-3 p-4 border-b border-separator-light dark:border-separator-dark/50 last:border-0">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{getUserName()}</p>
                  <span className="text-[11px] text-slate-400">방금</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">오늘 <span className="text-primary">로마서 8장</span>을 읽었습니다</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Urgent Prayer Modal */}
      {showUrgentPrayers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[80vh] overflow-y-auto">
            <UrgentPrayerList onClose={() => setShowUrgentPrayers(false)} />
          </div>
        </div>
      )}

      {/* Create Urgent Prayer Modal (Admin only) */}
      <CreateUrgentPrayerModal
        isOpen={showCreatePrayer}
        onClose={() => setShowCreatePrayer(false)}
        onSuccess={() => setUrgentPrayerCount(prev => prev + 1)}
      />
    </div>
  );
};

export default DashboardScreen;