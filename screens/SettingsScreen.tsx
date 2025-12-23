'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Language, Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { ProfileManager } from '@/components/ProfileManager';
import { supabase } from '@/lib/supabase';

interface SettingsScreenProps {
  navigate: (screen: Screen) => void;
  language: Language;
  toggleLanguage: () => void;
  t: Translations;
}

interface UserStats {
  streak: number;
  chaptersRead: number;
  cellName: string | null;
  cellId: string | null;
}

interface Cell {
  id: string;
  name: string;
  invite_code: string;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigate, language, toggleLanguage, t }) => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showCellJoinModal, setShowCellJoinModal] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({ streak: 0, chaptersRead: 0, cellName: null, cellId: null });
  const [cells, setCells] = useState<Cell[]>([]);
  const [selectedCellId, setSelectedCellId] = useState('');
  const [joiningCell, setJoiningCell] = useState(false);

  // Reading Settings State (synced with localStorage)
  const [fontSize, setFontSize] = useState(18);
  const [translation, setTranslation] = useState('KRV');
  const [audioSpeed, setAudioSpeed] = useState(1.0);

  // 1. Load Settings on Mount (User's Default / My Data)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem('bibleFontSize');
      if (savedSize) setFontSize(parseInt(savedSize));

      // Using 'preferredTranslation' as key for global default
      const savedTrans = localStorage.getItem('preferredTranslation');
      if (savedTrans) setTranslation(savedTrans);

      const savedSpeed = localStorage.getItem('audioSpeed');
      if (savedSpeed) setAudioSpeed(parseFloat(savedSpeed));
    }
  }, []);

  // 2. Setting Handlers (Cycle values)
  const cycleFontSize = () => {
    const sizes = [16, 18, 20, 24]; // Small, Medium, Large, XL
    const currentIndex = sizes.indexOf(fontSize);
    const nextSize = sizes[(currentIndex + 1) % sizes.length];

    setFontSize(nextSize);
    localStorage.setItem('bibleFontSize', nextSize.toString());
  };

  const cycleTranslation = () => {
    const trans = ['KRV', 'KLB', 'EASY'];
    const currentIndex = trans.indexOf(translation);
    const nextTrans = trans[(currentIndex + 1) % trans.length];

    setTranslation(nextTrans);
    localStorage.setItem('preferredTranslation', nextTrans);
  };

  const cycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.2, 1.5, 2.0];
    const currentIndex = speeds.indexOf(audioSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

    setAudioSpeed(nextSpeed);
    localStorage.setItem('audioSpeed', nextSpeed.toString());
  };

  const getFontSizeLabel = (size: number) => {
    if (size <= 16) return '작게';
    if (size === 18) return '보통';
    if (size === 20) return '크게';
    return '아주 크게';
  };

  const getTranslationLabel = (code: string) => {
    if (code === 'KRV') return '개역개정';
    if (code === 'KLB') return '현대인의성경';
    if (code === 'EASY') return '쉬운성경';
    return code;
  };

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data: readings } = await supabase
        .from('reading_activities')
        .select('id')
        .eq('user_id', user.id);

      const { data: dailyReadings } = await supabase
        .from('daily_readings')
        .select('reading_date')
        .eq('user_id', user.id)
        .order('reading_date', { ascending: false });

      const { data: cellMembership } = await supabase
        .from('cell_members')
        .select('cell_id, cells(id, name)')
        .eq('user_id', user.id)
        .maybeSingle();

      let streak = 0;
      if (dailyReadings && dailyReadings.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          const hasReading = dailyReadings.some((r: { reading_date: string }) => r.reading_date === dateStr);
          if (hasReading) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
      }

      const cellInfo = cellMembership?.cells as unknown as { id: string; name: string } | null;

      setUserStats({
        streak,
        chaptersRead: readings?.length || 0,
        cellName: cellInfo?.name || null,
        cellId: cellInfo?.id || null,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate(Screen.LOGIN);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'PASTOR': return '목사 / 관리자';
      case 'SUB_ADMIN': return '부관리자';
      case 'LEADER': return '셀 리더';
      default: return '셀원';
    }
  };

  const openCellJoinModal = async () => {
    const { data } = await supabase.from('cells').select('*').order('name');
    if (data) {
      setCells(data);
      if (data.length > 0) {
        setSelectedCellId(data[0].id);
      }
    }
    setShowCellJoinModal(true);
  };

  const joinCell = async () => {
    if (!user || !selectedCellId) return;
    setJoiningCell(true);

    try {
      // 1. 기존 셀 멤버십 확인
      const { data: existingMembership } = await supabase
        .from('cell_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMembership) {
        alert('이미 셀에 가입되어 있습니다. 기존 셀에서 탈퇴 후 다시 시도해주세요.');
        setJoiningCell(false);
        return;
      }

      // 2. 새 셀 가입
      const { error } = await supabase.from('cell_members').insert({
        cell_id: selectedCellId,
        user_id: user.id,
      });

      if (error) {
        console.error('Cell join error:', error);
        alert(`셀 가입에 실패했습니다: ${error.message}`);
      } else {
        alert('셀 가입이 완료되었습니다!');
        setShowCellJoinModal(false);
        fetchUserStats();
      }
    } catch (error) {
      console.error('Error joining cell:', error);
      alert('셀 가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setJoiningCell(false);
    }
  };

  return (
    <div className="bg-ios-bg-light dark:bg-ios-bg-dark font-display text-slate-900 dark:text-white antialiased">
      <div className="relative min-h-screen flex flex-col pb-24">

        <header className="sticky top-0 z-20 bg-ios-bg-light/90 dark:bg-ios-bg-dark/90 backdrop-blur-md transition-colors duration-300">
          <div className="flex flex-col px-4 pt-14 pb-2">
            <h1 className="text-[34px] font-bold tracking-tight text-black dark:text-white leading-tight">{t.settings.title}</h1>
            <div className="mt-2 relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
              </div>
              <input className="w-full bg-[#E3E3E8] dark:bg-[#1C1C1E] border-none rounded-[10px] py-2 pl-10 pr-4 text-[17px] text-black dark:text-white placeholder-slate-500 focus:ring-0" placeholder={t.settings.search} type="text" />
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-md mx-auto flex flex-col gap-5 mt-4">
          {/* Profile Section */}
          <section className="px-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-[84px] h-[84px] rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold ring-1 ring-black/5 dark:ring-white/10">
                  {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                {isAdmin && (
                  <div className="absolute -bottom-1 -right-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                    {profile?.role === 'PASTOR' ? '관리자' : '리더'}
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-[22px] font-semibold text-black dark:text-white leading-tight">
                  {profile?.name || user?.email?.split('@')[0] || '사용자'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[15px]">
                  {getRoleLabel(profile?.role)}
                </p>
                <button
                  onClick={() => setShowProfileManager(true)}
                  className="text-ios-blue text-[15px] mt-0.5 text-left"
                >
                  {t.settings.editProfile}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 flex flex-col justify-between h-[88px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-ios-orange text-2xl">local_fire_department</span>
                  <span className="text-2xl font-bold text-black dark:text-white">{userStats.streak}</span>
                </div>
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t.settings.dayStreak}</span>
              </div>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 flex flex-col justify-between h-[88px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-ios-blue text-2xl">auto_stories</span>
                  <span className="text-2xl font-bold text-black dark:text-white">{userStats.chaptersRead}</span>
                </div>
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t.settings.chaptersRead}</span>
              </div>
            </div>

            {/* Cell Info or Join Button */}
            <div className="mt-4">
              {userStats.cellName ? (
                <button
                  onClick={() => navigate(Screen.COMMUNITY)}
                  className="w-full bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 flex items-center gap-3 shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">groups</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-black dark:text-white">{userStats.cellName}</p>
                    <p className="text-[13px] text-slate-500">내 소속 셀 (터치하여 이동)</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                </button>
              ) : (
                <button
                  onClick={openCellJoinModal}
                  className="w-full bg-primary text-white rounded-[18px] p-4 flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                  <span className="material-symbols-outlined">group_add</span>
                  셀 가입하기
                </button>
              )}
            </div>
          </section>

          <div className="flex flex-col gap-6 px-4">
            {/* Account section */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">계정</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] divide-y divide-slate-200/50 dark:divide-slate-700/50 overflow-hidden shadow-sm">
                <SettingsRow
                  icon="security"
                  label={t.settings.securityEmail}
                  iconColor="text-ios-blue"
                  onClick={() => navigate(Screen.SECURITY)}
                />
                <SettingsRow
                  icon="group"
                  label={t.settings.community}
                  iconColor="text-ios-green"
                  onClick={() => navigate(Screen.COMMUNITY)}
                />
              </div>
            </section>

            {/* Language section */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">{t.settings.language}</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-ios-purple text-[22px]">translate</span>
                    <span className="text-[17px] text-black dark:text-white">{t.settings.language}</span>
                  </div>
                  <button
                    onClick={toggleLanguage}
                    className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {language === 'ko' ? '한국어' : 'English'}
                  </button>
                </div>
              </div>
            </section>

            {/* Reading Preferences (Global Default) */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">읽기 설정 (기본값)</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] divide-y divide-slate-200/50 dark:divide-slate-700/50 overflow-hidden shadow-sm">
                <SettingsRow
                  icon="menu_book"
                  label={t.settings.translation}
                  iconColor="text-ios-red"
                  value={getTranslationLabel(translation)}
                  onClick={cycleTranslation}
                />
                <SettingsRow
                  icon="format_size"
                  label={t.settings.fontSize}
                  iconColor="text-ios-orange"
                  value={getFontSizeLabel(fontSize)}
                  onClick={cycleFontSize}
                />
                <SettingsRow
                  icon="speed"
                  label={t.settings.audioSpeed}
                  iconColor="text-ios-teal"
                  value={`${audioSpeed}x`}
                  onClick={cycleSpeed}
                />
              </div>
            </section>

            {/* Support */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">지원</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] divide-y divide-slate-200/50 dark:divide-slate-700/50 overflow-hidden shadow-sm">
                <SettingsRow
                  icon="help"
                  label={t.settings.helpCenter}
                  iconColor="text-ios-blue"
                  onClick={() => navigate(Screen.HELP)}
                />
                <SettingsRow
                  icon="shield"
                  label={t.settings.privacyPolicy}
                  iconColor="text-ios-green"
                  onClick={() => navigate(Screen.PRIVACY)}
                />

                <SettingsRow
                  icon="groups_2"
                  label="그린시티교회 미디어 홍보팀"
                  iconColor="text-indigo-500"
                  onClick={() => navigate(Screen.MEDIA_TEAM)}
                />
              </div>
            </section>

            {/* Admin Section */}
            {isAdmin && (
              <section>
                <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">관리자</h3>
                <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] overflow-hidden shadow-sm">
                  <button
                    onClick={() => navigate(Screen.ADMIN)}
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-ios-red text-[22px]">admin_panel_settings</span>
                      <span className="text-[17px] text-black dark:text-white">관리자 페이지</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">chevron_right</span>
                  </button>
                </div>
              </section>
            )}

            {/* Logout Button */}
            <section className="mt-2">
              <button
                onClick={handleLogout}
                className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-4 rounded-[18px] text-[17px] font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                {t.settings.logOut}
              </button>
            </section>

            <p className="text-center text-slate-400 text-[13px] pb-6">{t.settings.version}</p>
          </div>
        </main>
      </div>

      {/* Profile Manager Modal */}
      {showProfileManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md">
            <ProfileManager t={t} onClose={() => setShowProfileManager(false)} />
          </div>
        </div>
      )}

      {/* Cell Join Modal */}
      {showCellJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-black dark:text-white">셀 가입하기</h2>
              <button onClick={() => setShowCellJoinModal(false)} className="text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">소속 셀 선택</label>
              <select
                value={selectedCellId}
                onChange={(e) => setSelectedCellId(e.target.value)}
                className="w-full p-3 bg-[#E3E3E8] dark:bg-[#2C2C2E] rounded-xl text-black dark:text-white"
              >
                {cells.map((cell) => (
                  <option key={cell.id} value={cell.id}>{cell.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={joinCell}
              disabled={joiningCell}
              className="w-full bg-primary text-white py-3 rounded-xl font-medium disabled:opacity-50"
            >
              {joiningCell ? '가입 중...' : '가입하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Row Component
function SettingsRow({ icon, label, iconColor, value, onClick }: { icon: string; label: string; iconColor: string; value?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3 active:bg-slate-100 dark:active:bg-white/5 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined ${iconColor} text-[22px]`}>{icon}</span>
        <span className="text-[17px] text-black dark:text-white">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-slate-400">
        {value && <span className="text-[15px]">{value}</span>}
        <span className="material-symbols-outlined text-[18px]">chevron_right</span>
      </div>
    </button>
  );
}

// Settings Toggle Row Component
function SettingsToggleRow({ icon, label, iconColor, defaultOn }: { icon: string; label: string; iconColor: string; defaultOn?: boolean }) {
  const [isOn, setIsOn] = useState(defaultOn ?? false);
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined ${iconColor} text-[22px]`}>{icon}</span>
        <span className="text-[17px] text-black dark:text-white">{label}</span>
      </div>
      <button
        onClick={() => setIsOn(!isOn)}
        className={`w-[51px] h-[31px] rounded-full flex items-center px-[2px] transition-colors ${isOn ? 'bg-primary' : 'bg-[#E3E3E8] dark:bg-[#39393D]'}`}
      >
        <div className={`w-[27px] h-[27px] rounded-full bg-white shadow-md transition-transform ${isOn ? 'translate-x-[20px]' : ''}`}></div>
      </button>
    </div>
  );
}

export default SettingsScreen;