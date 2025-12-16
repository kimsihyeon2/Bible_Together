import React from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';

interface LoginScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigate, t }) => {
  return (
    <div className="font-sans bg-background-light dark:bg-background-dark text-text-main dark:text-white min-h-screen flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-white transition-colors duration-300">
      <div className="w-full max-w-[380px] mx-auto flex flex-col h-full justify-center relative z-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary rounded-[28px] blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className="relative w-[88px] h-[88px] bg-surface-light dark:bg-surface-dark rounded-[28px] shadow-card flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[44px]">menu_book</span>
            </div>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-text-main dark:text-white mb-2">{t.login.title}</h1>
          <p className="text-text-muted text-[15px] font-medium leading-relaxed whitespace-pre-line">{t.login.subtitle}</p>
        </div>

        <form className="w-full space-y-5" onSubmit={(e) => { e.preventDefault(); navigate(Screen.DASHBOARD); }}>
          <div className="space-y-4">
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[22px]">mail</span>
              </div>
              <input className="block w-full rounded-2xl border-none bg-surface-light dark:bg-surface-dark py-[18px] pl-12 pr-4 text-[16px] text-text-main dark:text-white placeholder:text-gray-400 shadow-card ring-0 focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all duration-300 ease-out" id="email" placeholder={t.login.emailPlaceholder} type="email" />
            </div>
            <div className="group relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-[22px]">lock</span>
              </div>
              <input className="block w-full rounded-2xl border-none bg-surface-light dark:bg-surface-dark py-[18px] pl-12 pr-12 text-[16px] text-text-main dark:text-white placeholder:text-gray-400 shadow-card ring-0 focus:ring-2 focus:ring-primary/20 focus:shadow-lg transition-all duration-300 ease-out" id="password" placeholder={t.login.passwordPlaceholder} type="password" />
              <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-text-secondary dark:hover:text-gray-200 transition-colors" type="button">
                <span className="material-symbols-outlined text-[22px]">visibility_off</span>
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => alert(t.login.forgotPasswordAlert)}
                className="text-[13px] font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                {t.login.forgotPassword}
              </button>
            </div>
          </div>
          <button type="submit" className="w-full rounded-full bg-primary hover:bg-primary-hover py-4 text-white text-[17px] font-bold tracking-wide shadow-lg shadow-primary/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-2">
            {t.login.loginButton}
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background-light dark:bg-background-dark px-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">{t.login.or}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => alert(t.login.appleLoginAlert)}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-surface-light dark:bg-surface-dark py-3.5 px-4 text-[15px] font-semibold text-text-main dark:text-white shadow-card hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 active:scale-[0.98]"
            >
              <img alt="Apple" className="h-5 w-5 dark:invert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs6K7kDUlidjPoohBtvi0pB_QCCFCQ39m8IT9EoPsj25hC6Z2XLOQzciigQ_JgppxjdUpBQN9-U9oiDRIc7fAP8r-C3j-eBRR-boLzNZ86JIxDW2TzgAlMLK5-yc9YcOOHlS7Qh8R8A7N_72DCWhPCv7i2-I8AM66TBbybZdjV4s5Pv_CykUeR-wq6mr8FSCJ0npJSQDxwuAtGBvk324fV7cBcSLqDNywKD99vSLBORTIGwJR_-DPHL-vcsQjgOZYbhpQ2dDWVs6x9" />
              <span>{t.login.apple}</span>
            </button>
            <button
              type="button"
              onClick={() => alert(t.login.googleLoginAlert)}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-surface-light dark:bg-surface-dark py-3.5 px-4 text-[15px] font-semibold text-text-main dark:text-white shadow-card hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span>{t.login.google}</span>
            </button>
          </div>
        </form>
        <div className="mt-auto pt-8 text-center">
          <p className="text-text-secondary dark:text-gray-400 text-[15px]">
            {t.login.noAccount}
            <a className="font-semibold text-primary hover:text-primary-hover transition-colors ml-1" href="#">{t.login.signUp}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;