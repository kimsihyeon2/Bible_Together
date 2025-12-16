import React from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';

interface PlanDetailScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

const PlanDetailScreen: React.FC<PlanDetailScreenProps> = ({ navigate, t }) => {
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
          <h1 className="text-sm font-semibold uppercase tracking-wide opacity-70">Bible Plan</h1>
          <button className="size-9 flex items-center justify-center rounded-full bg-white/50 dark:bg-white/10 text-primary active:scale-95 transition-transform backdrop-blur-md">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </header>

        <main className="flex flex-col gap-6 px-5 pt-4">

          {/* Main Card */}
          <div className="relative w-full aspect-[4/5] max-h-[420px] rounded-[36px] overflow-hidden shadow-apple group">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC_E6IP2Npx4SFEQzA5SypgZkD72NMOM1ZdlIrWbLdlvkw9YnS_gTZrVVevmg6t111mf2Ch-8czzCXbMfWN_qt_weB_e0ub8K8mUCsMa5rkVrveJUOhxQjyL5NwtzpEC_Irwc7reXXBAk0Aeb0UrQQYmbUScDvCHo4W5lGyhHgHqm3-sbW4IzVzgVmedZRKKSog0sK6V74afHR1LDnQg7tq5QtAXA27e4Z8FynNpHtbIfyDMpbyo07SIUxplzpBNjdCEN2fcSLuHlbg")' }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-start gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/10 shadow-lg">
                30 Day Challenge
              </span>
              <h2 className="text-white text-5xl font-bold leading-tight tracking-tight drop-shadow-md">Gospel of<br />John</h2>
              <p className="text-white/90 text-sm font-medium leading-relaxed max-w-[80%]">A journey through the life of Jesus, discovering love and truth.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[28px] shadow-apple flex flex-col justify-between h-40 relative overflow-hidden group">
              <div className="z-10 flex flex-col">
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Progress</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">40</span>
                  <span className="text-sm font-bold text-gray-400">%</span>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 size-24 opacity-[0.03] dark:opacity-[0.05] rotate-12">
                <span className="material-symbols-outlined text-[120px]">donut_large</span>
              </div>
              <div className="z-10 mt-auto">
                <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-primary h-full rounded-full shadow-glow" style={{ width: '40%' }}></div>
                </div>
                <p className="text-xs text-gray-400 font-medium">Day 12 of 30</p>
              </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-[28px] shadow-apple flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-wider">Group</p>
                <button className="size-6 flex items-center justify-center bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
              </div>
              <div className="flex -space-x-3 mt-2 pl-1 py-1">
                <div className="relative size-11 rounded-full border-[3px] border-white dark:border-[#1C1C1E] p-[2px] bg-gradient-to-tr from-primary to-green-300">
                  <div className="size-full rounded-full bg-cover bg-center border-2 border-white dark:border-[#1C1C1E]" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDAXWczQeXb7WaKKAIahCeR8Lv_pq4qN3LeiE40Z0w9U44kKrT7Lh2zIX5M7En2CCqfuUWfEo2q0aCrfB1Iy0qFo9h_sSQdoKx3-jCNiQKB6xjMB7r85ABUbWI0mNn2WSjdY46Bp9gb_aE-BXZjhiSJIb8Y3gnvB0u9YU7iVxDuM9pB-TBYi0bm6Dt59L3SaM4unvC6wmZuyiGTEADQNIr-L3qZBfgIr5QzJm3piA8rMAAgPQsvMRS_Hmu6o8D2c8dNXVjMyPtb81Qb')" }}></div>
                </div>
                <div className="relative size-11 rounded-full border-[3px] border-white dark:border-[#1C1C1E] ring-1 ring-gray-100 dark:ring-white/10">
                  <div className="size-full rounded-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCzuM777QbOKuexyqBqhMTj4A0JRJkmm4FlY8-wphLjOTVeVQaWvZu7Lf9ZnviAI7lMBOLJJvhJJ04Gp1ptJ9Aj7mEmWIS57D0x3EUU2vnxb9pI4-6f8a3ESOqbS0jKQLbstmn7iYCIBTRpXWfylMp9iOzs90y6Xw7YQE0WzyxADmw8O6vIJGLUqgUExwX-jX6KqkfHUIhuTyUiUKDXU1cZTXRZJuIMgUgrp4M5uiHf3C9Il__YwnKOxA-kLdmFzNkEv_G6TZ_3xKpy')" }}></div>
                </div>
                <div className="relative size-11 rounded-full border-[3px] border-white dark:border-[#1C1C1E] flex items-center justify-center bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-500">
                  +4
                </div>
              </div>
              <p className="text-xs text-gray-400 font-medium">2 friends active today</p>
            </div>
          </div>

          {/* Up Next */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Up Next</h3>
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">Day 12</span>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark rounded-[32px] p-1.5 shadow-apple border border-gray-100/50 dark:border-white/5">
              <div className="flex flex-col">
                <div className="h-40 w-full rounded-[28px] bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCAyWut8q0pGlF_RR3Kju43FPTtxjekZPfuTks6b6K40kMA2Bu5sbA5VIn1xhkmgL0f1Ir_oe2WQtBv0iXBKo7l7a0M8sLrBbBoA0INDvIIPWQA34bo9YVo1YcBzX1tU6KcJNbArBxzyT9HWexawGOYV1oJSnzhSfFpGzj6f5e1_q_KfvJi4xQn8fQwCeQevriS_u63KYs9JaBDfXkZxu-tcwjFmJ-tKr-sZwHG1KPPbzCZ3QOmadWD7sGbzXF6ntFURmYcWzBk6qyY")' }}>
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-white text-[12px]">schedule</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">10 min</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <h4 className="text-xl font-bold leading-tight text-slate-900 dark:text-white">You must be born again</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">John 3:1-21</p>
                  </div>
                  <button className="w-full h-14 rounded-[20px] bg-primary hover:bg-[#2dbd43] text-white font-bold text-[17px] shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5">
                    <span className="material-symbols-outlined">play_circle</span>
                    Start Reading
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Schedule */}
          <section>
            <h3 className="text-xl font-bold tracking-tight mb-4 px-1 text-slate-900 dark:text-white">Schedule</h3>
            <div className="bg-surface-light dark:bg-surface-dark rounded-[24px] shadow-apple overflow-hidden">
              <div className="flex items-center gap-4 p-4 pl-5 border-b border-gray-100 dark:border-white/5 opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate">The Wedding at Cana</p>
                  <p className="text-xs text-gray-500">Day 10</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 pl-5 border-b border-gray-100 dark:border-white/5 opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0">
                <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold truncate">Clearing the Temple</p>
                  <p className="text-xs text-gray-500">Day 11</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 pl-5 bg-primary/5 border-b border-gray-100 dark:border-white/5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <div className="size-6 rounded-full bg-primary flex items-center justify-center text-white shadow-glow shrink-0">
                  <span className="material-symbols-outlined text-[14px] font-bold">play_arrow</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-slate-900 dark:text-white truncate">You must be born again</p>
                  <p className="text-xs text-primary font-semibold">Day 12 • Today</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 pl-5 border-b border-gray-100 dark:border-white/5 opacity-60">
                <div className="size-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 shrink-0">
                  <span className="text-[10px] font-bold">13</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium truncate">John the Baptist</p>
                  <p className="text-xs text-gray-500">Day 13</p>
                </div>
                <span className="material-symbols-outlined text-gray-300 text-[16px]">lock</span>
              </div>
              <div className="flex items-center gap-4 p-4 pl-5 opacity-60">
                <div className="size-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 shrink-0">
                  <span className="text-[10px] font-bold">14</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium truncate">The Samaritan Woman</p>
                  <p className="text-xs text-gray-500">Day 14</p>
                </div>
                <span className="material-symbols-outlined text-gray-300 text-[16px]">lock</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default PlanDetailScreen;