'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

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
  const [loading, setLoading] = useState(true);
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
    setLoading(true);

    try {
      // 1. 선택된 플랜 ID 확인
      const selectedPlanId = localStorage.getItem('selectedPlanId');

      let query = supabase
        .from('reading_plans')
        .select('*');

      if (selectedPlanId) {
        query = query.eq('id', selectedPlanId).single();
      } else {
        query = query.limit(1).maybeSingle();
      }

      const { data: plans } = await query;

      if (plans) {
        setPlan(plans);

        // 2. 사용자 진행 상황 조회
        const { data: progress } = await supabase
          .from('user_reading_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('plan_id', plans.id)
          .maybeSingle();

        if (progress) {
          setUserProgress(progress);
        } else {
          // 진행 상황이 없으면 생성
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

        // 3. 셀 멤버들의 진행 상황 조회
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
      setLoading(false);
    }
  };

  const completeToday = async () => {
    if (!user || !plan || !userProgress || completing) return;

    setCompleting(true);
    const currentDay = userProgress.current_day;
    const reading = JOHN_READING_SCHEDULE[currentDay - 1];

    try {
      // 1. reading_activities에 기록 추가
      await supabase.from('reading_activities').insert({
        user_id: user.id,
        user_name: profile?.name || '익명',
        book: '요한복음',
        chapter: reading?.chapter || currentDay,
        translation: 'KRV',
      });

      // 2. daily_readings에 기록 추가
      await supabase.from('daily_readings').upsert({
        user_id: user.id,
        reading_date: new Date().toISOString().split('T')[0],
        chapters_read: 1,
        minutes_read: 10,
      }, { onConflict: 'user_id,reading_date' });

      // 3. 진행 상황 업데이트
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
    // todayReading에서 책 이름과 장 정보를 localStorage에 저장
    const reading = JOHN_READING_SCHEDULE[currentDay - 1] || JOHN_READING_SCHEDULE[0];
    localStorage.setItem('selectedBook', '요한복음');
    localStorage.setItem('selectedChapter', String(reading.chapter));
    navigate(Screen.BIBLE);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const currentDay = userProgress?.current_day || 1;
  const progressPercent = Math.round((currentDay / (plan?.total_days || 30)) * 100);
  const todayReading = JOHN_READING_SCHEDULE[currentDay - 1];

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display selection:bg-primary/30">
      <div className="relative min-h-screen w-full max-w-md mx-auto bg-background-light dark:bg-black overflow-hidden shadow-2xl pb-24">

        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background-light/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10">
          <button
            onClick={() => navigate(Screen.DASHBOARD)}
            className="size-9 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/10 text-primary active:scale-95 transition-transform backdrop-blur-md"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-sm font-semibold uppercase tracking-wide opacity-70">읽기 플랜</h1>
          <button
            onClick={fetchPlanData}
            className="size-9 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/10 text-primary active:scale-95 transition-transform backdrop-blur-md"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </header>

        <main className="flex flex-col gap-6 px-5 pt-4">

          {/* Main Card */}
          <div className="relative w-full aspect-[4/5] max-h-[360px] rounded-[36px] overflow-hidden shadow-apple group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600")' }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-start gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/10 shadow-lg">
                {plan?.total_days || 30}일 플랜
              </span>
              <h2 className="text-white text-4xl font-bold leading-tight tracking-tight drop-shadow-md">
                {plan?.name || '요한복음 30일'}
              </h2>
              <p className="text-white/90 text-sm font-medium leading-relaxed max-w-[80%]">
                {plan?.description || '예수님의 삶을 따라가는 30일간의 여정'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[28px] shadow-apple flex flex-col justify-between h-40 relative overflow-hidden">
              <div className="z-10 flex flex-col">
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">전체 진행률</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{progressPercent}</span>
                  <span className="text-sm font-bold text-gray-400">%</span>
                </div>
              </div>
              <div className="z-10 mt-auto">
                <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full shadow-glow transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 font-medium">Day {currentDay} of {plan?.total_days || 30}</p>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[28px] shadow-apple flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider">함께 읽는 멤버</p>
              </div>
              <div className="flex -space-x-3 mt-2 pl-1 py-1">
                {cellMembers.slice(0, 3).map((member, idx) => (
                  <div key={idx} className="relative size-11 rounded-full border-[3px] border-white dark:border-[#1C1C1E] bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {member.name.charAt(0)}
                  </div>
                ))}
                {cellMembers.length > 3 && (
                  <div className="relative size-11 rounded-full border-[3px] border-white dark:border-[#1C1C1E] flex items-center justify-center bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-500">
                    +{cellMembers.length - 3}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {cellMembers.length > 0 ? `${cellMembers.length}명이 함께 읽어요` : '아직 참여자가 없어요'}
              </p>
            </div>
          </div>

          {/* Today's Reading */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">오늘의 읽기</h3>
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">Day {currentDay}</span>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark rounded-[32px] p-1.5 shadow-apple border border-gray-100/50 dark:border-white/5">
              <div className="flex flex-col">
                <div
                  className="h-36 w-full rounded-[28px] bg-cover bg-center relative overflow-hidden"
                  style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400")' }}
                >
                  <div className="absolute inset-0 bg-black/30"></div>
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-white text-[12px]">schedule</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">약 10분</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <h4 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">
                      {todayReading?.title || `Day ${currentDay} 읽기`}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
                      {todayReading?.verses || `요한복음 ${currentDay}장`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openBibleScreen}
                      className="flex-1 h-14 rounded-[20px] bg-gray-100 dark:bg-white/10 text-slate-900 dark:text-white font-bold text-[15px] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined">menu_book</span>
                      읽으러 가기
                    </button>
                    <button
                      onClick={completeToday}
                      disabled={completing}
                      className={`flex-1 h-14 rounded-[20px] font-bold text-[15px] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${completing
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-primary hover:bg-[#2dbd43] text-white shadow-primary/30'
                        }`}
                    >
                      {completing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined">check_circle</span>
                          완료
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h3 className="text-xl font-bold tracking-tight mb-4 px-1 text-slate-900 dark:text-white">읽기 일정</h3>
            <div className="bg-surface-light dark:bg-surface-dark rounded-[24px] shadow-apple overflow-hidden">
              {JOHN_READING_SCHEDULE.slice(Math.max(0, currentDay - 3), currentDay + 3).map((item) => {
                const isCompleted = item.day < currentDay;
                const isCurrent = item.day === currentDay;
                const isLocked = item.day > currentDay;

                return (
                  <div
                    key={item.day}
                    className={`flex items-center gap-4 p-4 pl-5 border-b border-gray-100 dark:border-white/5 relative ${isCurrent ? 'bg-primary/5' : isCompleted ? 'opacity-50' : isLocked ? 'opacity-60' : ''
                      }`}
                  >
                    {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
                    <div className={`size-6 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-primary/20 text-primary' :
                      isCurrent ? 'bg-primary text-white shadow-glow' :
                        'border border-gray-300 dark:border-gray-600 text-gray-400'
                      }`}>
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                      ) : isCurrent ? (
                        <span className="material-symbols-outlined text-[14px] font-bold">play_arrow</span>
                      ) : (
                        <span className="text-[10px] font-bold">{item.day}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[15px] truncate ${isCurrent ? 'font-bold text-slate-900 dark:text-white' : 'font-medium'}`}>
                        {item.title}
                      </p>
                      <p className={`text-xs ${isCurrent ? 'text-primary font-semibold' : 'text-gray-500'}`}>
                        Day {item.day} {isCurrent && '• 오늘'}
                      </p>
                    </div>
                    {isLocked && (
                      <span className="material-symbols-outlined text-gray-300 text-[16px]">lock</span>
                    )}
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