'use client';

import React, { useState } from 'react';
import { Screen } from '../types';
import { Language, Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { ProfileManager } from '@/components/ProfileManager';

interface SettingsScreenProps {
  navigate: (screen: Screen) => void;
  language: Language;
  toggleLanguage: () => void;
  t: Translations;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigate, language, toggleLanguage, t }) => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [showProfileManager, setShowProfileManager] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate(Screen.LOGIN);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'PASTOR': return '목사 / 관리자';
      case 'LEADER': return '셀 리더';
      default: return '셀원';
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
          {/* Profile Section - Now Dynamic */}
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

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 flex flex-col justify-between h-[88px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-ios-orange text-2xl">local_fire_department</span>
                  <span className="text-2xl font-bold text-black dark:text-white">12</span>
                </div>
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t.settings.dayStreak}</span>
              </div>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 flex flex-col justify-between h-[88px] shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-ios-blue text-2xl">auto_stories</span>
                  <span className="text-2xl font-bold text-black dark:text-white">45</span>
                </div>
                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">{t.settings.chaptersRead}</span>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-6 px-4">
            {/* Account section */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">계정</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] divide-y divide-slate-200/50 dark:divide-slate-700/50 overflow-hidden shadow-sm">
                <SettingsRow icon="security" label={t.settings.securityEmail} iconColor="text-ios-blue" />
                <SettingsRow icon="group" label={t.settings.community} iconColor="text-ios-green" />
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

            {/* Reading Preferences */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">읽기 설정</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] divide-y divide-slate-200/50 dark:divide-slate-700/50 overflow-hidden shadow-sm">
                <SettingsRow icon="menu_book" label={t.settings.translation} iconColor="text-ios-red" value="개역개정" />
                <SettingsRow icon="format_size" label={t.settings.fontSize} iconColor="text-ios-orange" value="중간" />
                <SettingsRow icon="speed" label={t.settings.audioSpeed} iconColor="text-ios-teal" value="1.0x" />
              </div>
            </section>

            {/* Notifications */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">알림</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] divide-y divide-slate-200/50 dark:divide-slate-700/50 overflow-hidden shadow-sm">
                <SettingsToggleRow icon="notifications" label={t.settings.dailyReminder} iconColor="text-ios-red" defaultOn={true} />
                <SettingsToggleRow icon="groups" label={t.settings.groupActivity} iconColor="text-ios-blue" defaultOn={true} />
              </div>
            </section>

            {/* Support */}
            <section>
              <h3 className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">지원</h3>
              <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] divide-y divide-slate-200/50 dark:divide-slate-700/50 overflow-hidden shadow-sm">
                <SettingsRow icon="help" label={t.settings.helpCenter} iconColor="text-ios-blue" />
                <SettingsRow icon="shield" label={t.settings.privacyPolicy} iconColor="text-ios-green" />
              </div>
            </section>

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
    </div>
  );
};

// Settings Row Component
const SettingsRow = ({ icon, label, iconColor, value }: { icon: string; label: string; iconColor: string; value?: string }) => (
  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
    <div className="flex items-center gap-3">
      <span className={`material-symbols-outlined ${iconColor} text-[22px]`}>{icon}</span>
      <span className="text-[17px] text-black dark:text-white">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-slate-500 text-[15px]">{value}</span>}
      <span className="material-symbols-outlined text-slate-400 text-[20px]">chevron_right</span>
    </div>
  </div>
);

// Settings Toggle Row Component
const SettingsToggleRow = ({ icon, label, iconColor, defaultOn }: { icon: string; label: string; iconColor: string; defaultOn?: boolean }) => {
  const [isOn, setIsOn] = React.useState(defaultOn || false);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined ${iconColor} text-[22px]`}>{icon}</span>
        <span className="text-[17px] text-black dark:text-white">{label}</span>
      </div>
      <button
        onClick={() => setIsOn(!isOn)}
        className={`relative inline-flex h-[31px] w-[51px] items-center rounded-full transition-colors ${isOn ? 'bg-ios-green' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <span className={`inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-md transition-transform ${isOn ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
      </button>
    </div>
  );
};

export default SettingsScreen;