import React from 'react';
import { Screen } from '../types';
import { Language, Translations } from '../i18n';

interface SettingsScreenProps {
  navigate: (screen: Screen) => void;
  language: Language;
  toggleLanguage: () => void;
  t: Translations;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigate, language, toggleLanguage, t }) => {
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
          <section className="px-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="w-[84px] h-[84px] rounded-full bg-slate-200 bg-cover bg-center ring-1 ring-black/5 dark:ring-white/10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCMwnoRWSiuM2gKimGtMOdFEP31g--dGAyzLA5vdddphRI5hTG5QYyYavyHanSKtDXhPgRWXndBX2ktkSCDB79c1YUCmoRmN2Y2fEiev7WyatGlYwRnrlbT3edWlIW5yCBiDtd5wxhatHdiIKR8on7YAkPTaYrpq9bQNq0ZEq1WFVvjptUkAROKN3ykKiocGgCS3jf_IFySvWlEpqdsw_84_w5FRkSL61AKiQuZsEFh0mgQ71lWU8wSiwfc29vWRe0eEOONSN6LZvEd')" }}></div>
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-[22px] font-semibold text-black dark:text-white leading-tight">Sarah Miller</h2>
                <p className="text-slate-500 dark:text-slate-400 text-[15px]">Grace Community Church</p>
                <a className="text-ios-blue text-[15px] mt-0.5" href="#">{t.settings.editProfile}</a>
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

            {/* Language Selector - NEW! */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-[10px] overflow-hidden shadow-sm">
              <div
                className="relative flex items-center p-3 pl-4 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group"
                onClick={toggleLanguage}
              >
                <div className="w-[28px] h-[28px] rounded-[6px] bg-primary flex items-center justify-center text-white mr-3 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">language</span>
                </div>
                <div className="flex-1 flex items-center justify-between pt-1 pb-1">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.language}</span>
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-[17px] text-slate-500 dark:text-slate-400">{language === 'ko' ? '한국어' : 'English'}</span>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px]">sync</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-[10px] overflow-hidden shadow-sm">
              <div className="relative flex items-center p-3 pl-4 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-ios-blue flex items-center justify-center text-white mr-3 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pt-1 group-last:border-0">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.securityEmail}</span>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px] mr-2">chevron_right</span>
                </div>
              </div>
              <div className="relative flex items-center p-3 pl-4 pt-0 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-ios-purple flex items-center justify-center text-white mr-3 shrink-0 mt-2">
                  <span className="material-symbols-outlined text-[18px]">church</span>
                </div>
                <div className="flex-1 flex items-center justify-between pt-3 pb-1">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.community}</span>
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-[17px] text-slate-500 dark:text-slate-400">Grace Church</span>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px]">chevron_right</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-[10px] overflow-hidden shadow-sm">
              <div className="relative flex items-center p-3 pl-4 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-ios-orange flex items-center justify-center text-white mr-3 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">translate</span>
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pt-1">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.translation}</span>
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-[17px] text-slate-500 dark:text-slate-400">NIV</span>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px]">chevron_right</span>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center p-3 pl-4 pt-0 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-slate-500 flex items-center justify-center text-white mr-3 shrink-0 mt-2">
                  <span className="material-symbols-outlined text-[18px]">format_size</span>
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pt-3 pb-3">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.fontSize}</span>
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-[17px] text-slate-500 dark:text-slate-400">Medium</span>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px]">chevron_right</span>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center p-3 pl-4 pt-0 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-slate-400 flex items-center justify-center text-white mr-3 shrink-0 mt-2">
                  <span className="material-symbols-outlined text-[18px]">speed</span>
                </div>
                <div className="flex-1 flex items-center justify-between pt-3 pb-1">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.audioSpeed}</span>
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-[17px] text-slate-500 dark:text-slate-400">1.0x</span>
                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px]">chevron_right</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-[10px] overflow-hidden shadow-sm">
              <div className="relative flex items-center p-3 pl-4 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-ios-red flex items-center justify-center text-white mr-3 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pt-1">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.dailyReminder}</span>
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-[6px] mr-2">
                    <span className="text-[15px] font-semibold text-black dark:text-white">7:00 AM</span>
                  </div>
                </div>
              </div>
              <div className="relative flex items-center p-3 pl-4 pt-0">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-primary flex items-center justify-center text-white mr-3 shrink-0 mt-2">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                </div>
                <div className="flex-1 flex items-center justify-between pt-3 pb-1">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.groupActivity}</span>
                  <input defaultChecked className="ios-toggle mr-2" type="checkbox" />
                </div>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-[10px] overflow-hidden shadow-sm">
              <div className="relative flex items-center p-3 pl-4 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-ios-blue flex items-center justify-center text-white mr-3 shrink-0">
                  <span className="material-symbols-outlined text-[18px]">help</span>
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 pt-1">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.helpCenter}</span>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px] mr-2">chevron_right</span>
                </div>
              </div>
              <div className="relative flex items-center p-3 pl-4 pt-0 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-[28px] h-[28px] rounded-[6px] bg-ios-teal flex items-center justify-center text-white mr-3 shrink-0 mt-2">
                  <span className="material-symbols-outlined text-[18px]">policy</span>
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pt-3 pb-3">
                  <span className="text-[17px] text-black dark:text-white">{t.settings.privacyPolicy}</span>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-[20px] mr-2">chevron_right</span>
                </div>
              </div>
              <div
                className="relative flex items-center p-3 pl-4 pt-0 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group"
                onClick={() => navigate(Screen.LOGIN)}
              >
                <div className="flex-1 flex items-center justify-center pt-3 pb-1">
                  <span className="text-[17px] text-ios-red font-normal">{t.settings.logOut}</span>
                </div>
              </div>
            </div>

            <div className="text-center pb-8 pt-2">
              <p className="text-[13px] text-slate-400 dark:text-slate-500">{t.settings.version}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsScreen;