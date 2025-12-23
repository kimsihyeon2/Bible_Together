import React from 'react';
import { Screen, NavProps } from '../types';
import { Translations } from '../i18n';

interface BottomNavProps extends NavProps {
  t: Translations;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, navigate, t }) => {
  const getIconClass = (screen: Screen) => {
    return currentScreen === screen
      ? "text-primary dark:text-primary"
      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300";
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-black/5 dark:border-white/10 pb-safe">
      <div className="flex items-center justify-around pt-2 pb-1">
        <button
          onClick={() => navigate(Screen.DASHBOARD)}
          className={`flex flex-col items-center gap-1 p-2 w-16 ${getIconClass(Screen.DASHBOARD)}`}
        >
          <span className="material-symbols-outlined text-[26px]">home</span>
          <span className="text-[10px] font-medium">{t.nav.home}</span>
        </button>

        <button
          onClick={() => navigate(Screen.BIBLE)}
          className={`flex flex-col items-center gap-1 p-2 w-16 ${getIconClass(Screen.BIBLE)}`}
        >
          <span className="material-symbols-outlined text-[26px]">menu_book</span>
          <span className="text-[10px] font-medium">{t.nav.bible}</span>
        </button>

        <button
          onClick={() => navigate(Screen.COMMUNITY)}
          className={`flex flex-col items-center gap-1 p-2 w-16 ${getIconClass(Screen.COMMUNITY)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${currentScreen === Screen.COMMUNITY ? "font-variation-settings-fill-1" : ""}`}>groups</span>
          <span className="text-[10px] font-medium">{t.nav.community}</span>
        </button>

        <button
          onClick={() => navigate(Screen.PRAYER_WALL)}
          className={`flex flex-col items-center gap-1 p-2 w-16 ${getIconClass(Screen.PRAYER_WALL)}`}
        >
          <span className={`material-symbols-outlined text-[26px] ${currentScreen === Screen.PRAYER_WALL ? "font-variation-settings-fill-1" : ""}`}>favorite</span>
          <span className="text-[10px] font-medium">{t.prayer.title}</span>
        </button>

        <button
          onClick={() => navigate(Screen.SETTINGS)}
          className={`flex flex-col items-center gap-1 p-2 w-16 ${getIconClass(Screen.SETTINGS)}`}
        >
          <span className="material-symbols-outlined text-[26px]">person</span>
          <span className="text-[10px] font-medium">{t.nav.profile}</span>
        </button>
      </div>
    </nav>
  );
};