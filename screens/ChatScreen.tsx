import React from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';

interface ChatScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigate, t }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-sans h-[100dvh] flex flex-col overflow-hidden text-gray-900 dark:text-white antialiased selection:bg-primary/30">
      <header className="flex-none bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 pt-12 pb-2 px-2 flex items-center justify-between sticky top-0 z-40">
        <button
          onClick={() => navigate(Screen.DASHBOARD)}
          className="flex items-center text-primary px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-[26px]">chevron_left</span>
          <span className="text-[17px] font-normal leading-none pb-0.5 -ml-1">Back</span>
        </button>
        <div className="flex flex-col items-center justify-center -ml-4">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">Cell Group A</h2>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Psalm 23</span>
        </div>
        <button className="flex items-center justify-center size-9 rounded-full text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined text-[22px]">info</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 scroll-smooth bg-white dark:bg-background-dark">
        <div className="flex w-full justify-center py-6">
          <span className="text-gray-400 dark:text-gray-500 text-[11px] font-medium tracking-wide">Today 10:28 AM</span>
        </div>

        {/* Message 1 */}
        <div className="flex items-end gap-2 mb-3 group animate-pop">
          <div className="size-[30px] rounded-full bg-gray-200 bg-cover bg-center shrink-0 mb-0.5 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuB42cHXA047zAY3EUPcW2GJVvEzHBYekcLVDyvmvw7ZnIm08Qp1R4_k9qkcpdFhsVaZ0zX9SF5cXIiBwegTdkmzHzgrflYIsyGmpoRHfzO-xcxyVRGOeFyx8AcbDr37WHNcatugZkjDPBUeraXU536ISnGXp8Sk4LEdk-KQKt5EJKaWSF5BZJSgpVpnL4SZp4ku06Zd6BfAGUE3xtkUGZ9o3NhgC4P9kjG_iC1lHoXzJvR1oEFunUBuu4KJ3xwsIFUkjUB9hTHiPDLG")' }}></div>
          <div className="flex flex-col gap-1 max-w-[75%] items-start">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-3 hidden group-hover:block transition-all">Sarah</span>
            <div className="px-4 py-2 bg-bubble-rec-light dark:bg-bubble-rec-dark rounded-bubble rounded-bl-[4px] text-[16px] text-gray-900 dark:text-white leading-[1.35] tracking-tight">
              Did anyone else struggle with verse 4 today?
            </div>
          </div>
        </div>

        {/* Message 2 */}
        <div className="flex items-end gap-2 mb-3 group animate-pop">
          <div className="size-[30px] rounded-full bg-gray-200 bg-cover bg-center shrink-0 mb-0.5 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAXwRZyDe7skClsV3SHYl6yPetrlN61clxjSku7cD7pGZNsWxjdYQ_GQ3928bggknU1G8AotCPLYtthWFfTJr2_n0yySyG40pBZ695YYPbzPK9IQhveMDYhvBIEuXvBV1NxkMToeiHoyFpwPZ3zt0X9lQYtnN_DR_QEW1sSdo_9aWQx5ZNpcQm1F8-m-xmrtePerv03bhwaFq1DmxBNyxOR9f2ktdQJhzH9_wI_QB3PBJnQdSF0Eo3TYEuFfavA0Ds0q8G-YHvK5hGF")' }}></div>
          <div className="flex flex-col gap-1 max-w-[75%] items-start">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-3 hidden group-hover:block transition-all">David</span>
            <div className="px-4 py-2 bg-bubble-rec-light dark:bg-bubble-rec-dark rounded-bubble rounded-bl-[4px] text-[16px] text-gray-900 dark:text-white leading-[1.35] tracking-tight">
              I think it refers to comfort in difficult times. It felt really relatable.
            </div>
          </div>
        </div>

        {/* BibleBot Message */}
        <div className="flex items-end gap-2 mb-6 group animate-pop">
          <div className="size-[30px] rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 mb-0.5 border border-gray-100 dark:border-gray-700 shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
          </div>
          <div className="flex flex-col gap-1 max-w-[85%] items-start">
            <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 ml-3">BibleBot</span>
            <div className="overflow-hidden rounded-xl bg-surface-light dark:bg-bubble-rec-dark border border-gray-200/50 dark:border-gray-700/50 shadow-sm w-full">
              <div className="p-3 relative flex gap-3">
                <div className="shrink-0 w-1 rounded-full bg-primary my-1"></div>
                <p className="text-[15px] italic text-gray-600 dark:text-gray-300 leading-relaxed font-serif py-1">
                  "Even though I walk through the darkest valley, I will fear no evil, for you are with me..."
                </p>
              </div>
              <div className="bg-white/50 dark:bg-white/5 px-3 py-2.5 flex items-center justify-between border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-900 dark:text-white">Psalm 23:4</span>
                  <span className="text-[10px] text-gray-500">New International Version</span>
                </div>
                <button className="size-7 rounded-full bg-white dark:bg-gray-600 shadow-sm flex items-center justify-center text-primary hover:scale-105 transition-transform active:scale-95">
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sent Message */}
        <div className="flex flex-col items-end gap-1 mb-2 animate-pop">
          <div className="flex items-end gap-2 max-w-[75%] flex-row-reverse">
            <div className="px-4 py-2 bg-primary text-white rounded-bubble rounded-br-[4px] text-[16px] leading-[1.35] tracking-tight shadow-subtle">
              That's a great insight, thanks for sharing! 🙏
            </div>
          </div>
          <div className="flex items-center gap-1 mr-1">
            <span className="text-[10px] text-gray-400 font-medium">Delivered</span>
          </div>
        </div>
        <div className="h-6"></div>
      </main>

      {/* Input */}
      <footer className="flex-none bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 p-2 pb-8 z-40">
        <div className="flex items-end gap-2 max-w-4xl mx-auto w-full px-1">
          <button className="shrink-0 size-9 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors mb-[3px] active:scale-95">
            <span className="material-symbols-outlined text-[22px]">add</span>
          </button>
          <button className="shrink-0 size-9 rounded-full bg-transparent text-gray-400 dark:text-gray-500 flex items-center justify-center hover:text-primary dark:hover:text-primary transition-colors mb-[3px] active:scale-95">
            <span className="material-symbols-outlined text-[24px] filled" style={{ fontVariationSettings: "'FILL' 0" }}>menu_book</span>
          </button>
          <div className="flex-1 min-h-[38px] border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1.5 bg-white dark:bg-background-dark focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center shadow-sm">
            <input className="w-full bg-transparent border-none p-0 text-[16px] text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 leading-normal" placeholder="Message" type="text" />
          </div>
          <button className="shrink-0 size-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all shadow-md mb-[4px] active:scale-90">
            <span className="material-symbols-outlined text-[18px] font-bold">arrow_upward</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;