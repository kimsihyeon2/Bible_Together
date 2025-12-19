'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useLoading } from '@/lib/loading-context';

interface PlanDetailScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  total_days: number;
  cover_image_url: string | null;
}

interface UserProgress {
  id: string;
  current_day: number;
  started_at: string;
  last_read_at: string | null;
  completed: boolean;
}

// 요한복음 읽기 일정 (30일)
const JOHN_READING_SCHEDULE = [
  { day: 1, title: '말씀이 육신이 되어', verses: '요한복음 1:1-18', chapter: 1 },
  { day: 2, title: '세례 요한의 증거', verses: '요한복음 1:19-34', chapter: 1 },
  { day: 3, title: '첫 제자들', verses: '요한복음 1:35-51', chapter: 1 },
  { day: 4, title: '가나의 혼인 잔치', verses: '요한복음 2:1-12', chapter: 2 },
  { day: 5, title: '성전을 정결케 하심', verses: '요한복음 2:13-25', chapter: 2 },
  { day: 6, title: '니고데모와의 대화', verses: '요한복음 3:1-21', chapter: 3 },
  { day: 7, title: '세례 요한의 마지막 증거', verses: '요한복음 3:22-36', chapter: 3 },
  { day: 8, title: '사마리아 여인', verses: '요한복음 4:1-26', chapter: 4 },
  { day: 9, title: '사마리아의 추수', verses: '요한복음 4:27-42', chapter: 4 },
  { day: 10, title: '왕의 신하의 아들', verses: '요한복음 4:43-54', chapter: 4 },
  { day: 11, title: '베데스다의 치유', verses: '요한복음 5:1-18', chapter: 5 },
  { day: 12, title: '아들의 권세', verses: '요한복음 5:19-47', chapter: 5 },
  { day: 13, title: '오천 명을 먹이심', verses: '요한복음 6:1-15', chapter: 6 },
  { day: 14, title: '생명의 떡', verses: '요한복음 6:16-71', chapter: 6 },
  { day: 15, title: '예수님의 형제들', verses: '요한복음 7:1-24', chapter: 7 },
  { day: 16, title: '예수님은 누구인가?', verses: '요한복음 7:25-52', chapter: 7 },
  { day: 17, title: '간음한 여인', verses: '요한복음 8:1-11', chapter: 8 },
  { day: 18, title: '세상의 빛', verses: '요한복음 8:12-59', chapter: 8 },
  { day: 19, title: '맹인을 고치심', verses: '요한복음 9:1-41', chapter: 9 },
  { day: 20, title: '선한 목자', verses: '요한복음 10:1-21', chapter: 10 },
  { day: 21, title: '봉헌절', verses: '요한복음 10:22-42', chapter: 10 },
  { day: 22, title: '나사로의 죽음', verses: '요한복음 11:1-44', chapter: 11 },
  { day: 23, title: '죽이려는 음모', verses: '요한복음 11:45-57', chapter: 11 },
  { day: 24, title: '마리아의 기름 부음', verses: '요한복음 12:1-19', chapter: 12 },
  { day: 25, title: '밀알의 비유', verses: '요한복음 12:20-50', chapter: 12 },
  { day: 26, title: '세족식', verses: '요한복음 13:1-38', chapter: 13 },
  { day: 27, title: '길과 진리와 생명', verses: '요한복음 14:1-31', chapter: 14 },
  { day: 28, title: '참 포도나무', verses: '요한복음 15:1-27', chapter: 15 },
  { day: 29, title: '성령의 사역', verses: '요한복음 16:1-33', chapter: 16 },
  { day: 30, title: '대제사장의 기도', verses: '요한복음 17:1-26', chapter: 17 },
];

const PlanDetailScreen: React.FC<PlanDetailScreenProps> = ({ navigate, t }) => {
  const { user, profile } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [plan, setPlan] = useState<ReadingPlan | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [completing, setCompleting] = useState(false);
  const [cellMembers, setCellMembers] = useState<{ name: string; current_day: number }[]>([]);

  useEffect(() => {
    if (user) {
      fetchPlanData();
    }
  }, [user]);

  const fetchPlanData = async () => {
    if (!user) return;
    showLoading('오늘의 말씀을 불러오고 있어요...');

    try {
      const selectedPlanId = localStorage.getItem('selectedPlanId');
      let query = supabase.from('reading_plans').select('*');

      if (selectedPlanId) {
        query = query.eq('id', selectedPlanId).single();
      } else {
        query = query.limit(1).maybeSingle();
      }

      const { data: plans } = await query;

      if (plans) {
        setPlan(plans);

        const { data: progress } = await supabase
          .from('user_reading_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plans.id)
          .maybeSingle();

        if (progress) {
          setUserProgress(progress);
        } else {
          const { data: newProgress } = await supabase
            .from('user_reading_progress')
            .insert({
              user_id: user.id,
              plan_id: plans.id,
              current_day: 1,
            })
            .select()
            .maybeSingle();

          if (newProgress) {
            setUserProgress(newProgress);
          }
        }

        const { data: membership } = await supabase
          .from('cell_members')
          .select('cell_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership) {
          const { data: cellProgress } = await supabase
            .from('user_reading_progress')
            .select('user_id, current_day, profiles(name)')
            .eq('plan_id', plans.id);

          if (cellProgress) {
            const members = cellProgress.map((p: any) => ({
              name: p.profiles?.name || '익명',
              current_day: p.current_day,
            })).slice(0, 5);
            setCellMembers(members);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      hideLoading();
    }
  };

  const completeToday = async () => {
    if (!user || !plan || !userProgress || completing) return;

    setCompleting(true);
    const currentDay = userProgress.current_day;
    const reading = JOHN_READING_SCHEDULE[currentDay - 1];

    try {
      await supabase.from('reading_activities').insert({
        user_id: user.id,
        user_name: profile?.name || '익명',
        book: '요한복음',
        chapter: reading?.chapter || currentDay,
        translation: 'KRV',
      });

      await supabase.from('daily_readings').upsert({
        user_id: user.id,
        reading_date: new Date().toISOString().split('T')[0],
        chapters_read: 1,
        minutes_read: 10,
      }, { onConflict: 'user_id,reading_date' });

      const nextDay = Math.min(currentDay + 1, plan.total_days);
      const isCompleted = nextDay > plan.total_days;

      const { data: updatedProgress } = await supabase
        .from('user_reading_progress')
        .update({
          current_day: nextDay,
          last_read_at: new Date().toISOString(),
          completed: isCompleted,
        })
        .eq('id', userProgress.id)
        .select()
        .maybeSingle();

      if (updatedProgress) {
        setUserProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Error completing reading:', error);
    } finally {
      setCompleting(false);
    }
  };

  const openBibleScreen = () => {
    const reading = JOHN_READING_SCHEDULE[currentDay - 1] || JOHN_READING_SCHEDULE[0];
    localStorage.setItem('selectedBook', '요한복음');
    localStorage.setItem('selectedChapter', String(reading.chapter));
    navigate(Screen.BIBLE);
  };

  const currentDay = userProgress?.current_day || 1;
  const progressPercent = Math.round((currentDay / (plan?.total_days || 30)) * 100);
  const todayReading = JOHN_READING_SCHEDULE[currentDay - 1];

  return (
    <div className="bg-gradient-to-b from-[#e0f2fe] to-[#dcfce7] dark:from-slate-900 dark:to-slate-800 text-slate-800 dark:text-slate-100 font-sans antialiased pb-24 selection:bg-green-200 min-h-screen">
      <div className="relative z-10 flex flex-col h-full max-w-md mx-auto">
        {/* Header */}
        <div className="h-14 w-full flex items-center justify-between px-6 pt-2">
          <button
            onClick={() => navigate(Screen.DASHBOARD)}
            className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <span className="text-sm font-bold opacity-0">Plan Details</span>
          <button className="w-10 h-10 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-xl">more_horiz</span>
          </button>
        </div>

        <main className="px-4 md:px-6 space-y-6">
          {/* Hero Card */}
          <div className="relative w-full h-[26rem] rounded-[2.5rem] overflow-hidden shadow-xl shadow-green-900/10 group">
            <img
              alt={plan?.name || "Reading Plan"}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              src={plan?.cover_image_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuBRrxKSZI-whRkX1_ZZ8aM7IxOaMImVYwN2rYjxGGMXxY3RiGk1_F6EGISytyLj6Rc6GS6scjAnYa9joDqfHoaet6su03mFbswvLtrv5gMWl27QWDfv7vPw_bBnTqEbJXpCsBPEBdFhzo58thxHyGPjBU0zy0bAbRcZqGRnsS-qAJjx0HDlnfggMYJCGcZ7YD5iC9n7y9CfPLcTiTFtak_3Y7W5ypExTEBTBVGgrM72abO2mxXQWohZVSDjaRwLa31goahaXVMDV-Qv"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-green-950/80 via-green-900/20 to-transparent mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-end pb-10">
              <div className="absolute top-6 left-6 bg-white/25 backdrop-blur-md border border-white/40 text-white text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wider shadow-sm">
                {plan?.total_days || 30} Day Challenge
              </div>
              <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg tracking-tight leading-none">{plan?.name || 'Gospel of\nJohn'}</h1>
              <p className="text-green-50 text-sm font-medium leading-relaxed max-w-[90%] drop-shadow-md">
                {plan?.description || 'A journey through the life of Jesus, discovering love and truth in the green pastures of His word.'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Total Progress */}
            <div className="col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2rem] flex items-center justify-between relative overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-pasture-green/50 to-transparent opacity-50"></div>
              <div className="z-10 w-2/3">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Total Progress</p>
                <div className="flex items-baseline space-x-1.5 mb-3">
                  <span className="text-5xl font-bold text-slate-800 dark:text-white tracking-tighter">{progressPercent}</span>
                  <span className="text-2xl text-slate-400 dark:text-slate-500 font-medium">%</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 font-medium">Day {currentDay} of {plan?.total_days || 30}</p>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100 dark:text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                  <path className="text-green-500 drop-shadow-sm" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                </svg>
              </div>
            </div>

            {/* Community */}
            <div className="bg-pasture-sky dark:bg-slate-800 p-5 rounded-[2rem] flex flex-col justify-between h-40 relative shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-sky-700 dark:text-slate-400 uppercase tracking-wide">Community</span>
                <button className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-sky-500 dark:text-sky-300 shadow-sm">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
              <div className="flex -space-x-3 items-center mt-2 pl-1">
                {cellMembers.slice(0, 3).map((member, idx) => (
                  <div key={idx} className="w-11 h-11 rounded-full border-[3px] border-white dark:border-slate-800 bg-sky-200 flex items-center justify-center text-sky-800 font-bold text-xs ring-2 ring-sky-200 dark:ring-sky-900 shadow-sm relative z-10">
                    {member.name.charAt(0)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-sky-800 dark:text-sky-200 font-semibold">{cellMembers.length} friends active</p>
            </div>

            {/* Prayer */}
            <div className="bg-pasture-green dark:bg-slate-800 p-5 rounded-[2rem] flex flex-col justify-between h-40 relative shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-green-700 dark:text-slate-400 uppercase tracking-wide">Prayer</span>
                <button className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-green-600 dark:text-green-300 shadow-sm">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
              <p className="text-3xl font-bold text-green-800 dark:text-white mt-4">5</p>
              <p className="text-xs text-green-800 dark:text-green-200 font-semibold">prayers today</p>
            </div>
          </div>

          {/* Up Next */}
          <section>
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Up Next</h2>
              <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs font-bold px-3 py-1.5 rounded-full">Day {currentDay}</span>
            </div>
            <div className="w-full bg-white dark:bg-slate-800 rounded-[2.5rem] p-4 shadow-lg shadow-green-900/5 border border-green-50 dark:border-slate-700">
              <div className="relative w-full h-40 rounded-[1.8rem] overflow-hidden mb-4 shadow-sm group">
                <img alt="Sheep" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn3FLve9NbrlC-sAC0-Ew1e04rYP54bnVXHo56pmRr88pJvemgxtva3GkogRNZretszOhYViVxhGiacEl1SsxBjc4Yh4jFyFMNHGEao0MHbZ5BHuZeXxg4lYm-1GCNQKcn_LOSzBBfExfjB8TvA1ohCYtOYvpa5iw7Ijhvolh4mHpuCFi_vNbfvhU8EvTWQWEcLKhEcSqjKAUOz715QWcCREF5oWN1MjJ4om1OKa-6ropfW-hxVIDJ3WmGLn-vdc31keM63YZzysxy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center shadow-sm">
                  <span className="material-symbols-outlined text-xs mr-1">schedule</span> 10 MIN
                </div>
              </div>
              <div className="px-2 pb-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">{todayReading?.title || "Reading"}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center mt-1">
                      <span className="material-symbols-outlined text-base text-green-500 mr-1">menu_book</span>
                      {todayReading?.verses}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openBibleScreen}
                      className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/40 hover:scale-105 transition-transform"
                    >
                      <span className="material-symbols-outlined text-2xl">play_arrow</span>
                    </button>
                    <button
                      onClick={completeToday}
                      disabled={completing}
                      className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition-transform ${completing ? 'bg-gray-300' : 'bg-blue-500 hover:scale-105 shadow-blue-500/40'}`}
                    >
                      {completing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-symbols-outlined text-2xl">check</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 px-2">Schedule</h2>
            <div className="space-y-3 relative">
              <div className="absolute left-[2.25rem] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-700 rounded-full -z-10"></div>
              {JOHN_READING_SCHEDULE.slice(Math.max(0, currentDay - 3), currentDay + 3).map((item) => {
                const isCompleted = item.day < currentDay;
                const isCurrent = item.day === currentDay;
                const isLocked = item.day > currentDay;

                return isCurrent ? (
                  <div key={item.day} className="flex items-center p-4 bg-white dark:bg-slate-800 rounded-3xl border border-green-100 dark:border-green-900 shadow-md shadow-green-900/5 relative z-10 transform scale-105 transition-transform">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/30 ring-4 ring-green-50 dark:ring-green-900">
                        <span className="material-symbols-outlined text-xl">play_arrow</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wide mt-0.5">Today • Day {item.day}</p>
                    </div>
                  </div>
                ) : (
                  <div key={item.day} className={`flex items-center p-3 rounded-2xl border border-transparent ${isCompleted ? 'bg-white/60 dark:bg-slate-800/60' : 'opacity-60'}`}>
                    <div className="flex-shrink-0 mr-4 z-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 ${isCompleted ? 'bg-sky-100 dark:bg-sky-900 text-sky-600 dark:text-sky-300' : 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400'}`}>
                        {isCompleted ? <span className="material-symbols-outlined text-lg">check</span> : <span className="text-xs font-bold">{item.day}</span>}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className={`text-sm font-bold text-slate-700 dark:text-slate-300 ${isCompleted ? 'line-through decoration-slate-400' : ''}`}>{item.title}</h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Day {item.day}</p>
                    </div>
                    {isLocked && <span className="material-symbols-outlined text-slate-300 text-sm">lock</span>}
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PlanDetailScreen;