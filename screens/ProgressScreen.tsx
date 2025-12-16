import React from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';

interface ProgressScreenProps {
  navigate: (screen: Screen) => void;
  t: Translations;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigate, t }) => {
  return (
    <div className="bg-ios-bg-light dark:bg-ios-bg-dark text-slate-900 dark:text-white antialiased transition-colors duration-200">
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-ios-bg-light dark:bg-ios-bg-dark pb-28 overflow-x-hidden">

        <div className="flex items-center justify-between px-4 py-2 sticky top-0 z-30 bg-ios-bg-light/80 dark:bg-ios-bg-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/10">
          <button
            onClick={() => navigate(Screen.DASHBOARD)}
            className="flex items-center gap-1 text-ios-blue active:opacity-60 transition-opacity"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
            <span className="text-[17px] leading-none -ml-1">Back</span>
          </button>
          <span className="text-[17px] font-semibold text-center opacity-0 transition-opacity duration-300">My Progress</span>
          <button className="flex items-center justify-center text-ios-blue active:opacity-60 transition-opacity">
            <span className="material-symbols-outlined text-xl">ios_share</span>
          </button>
        </div>

        <div className="flex flex-col gap-5 px-4 pt-2">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <h1 className="text-[34px] font-bold tracking-tight leading-tight text-gray-900 dark:text-white">Summary</h1>
              <div className="h-10 w-10 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBkdTVQcngKDKcA1p-ICJMTea76mb-sKhaAZ3XYh7m3zHkvKWcK6iD9i4yR8L3Ami7LVnscnplzTS28C1a_ipqo6kanzNafqVrfnGBC63GNJLOawsc0uxuJM5s61h-KYsSdexS0cdHciapmBdKEuLAitaFFK0fmC8E3FBe5nikth7EQdkIvOdYcMYQzXu0zCl7BrkDOYPuWZCSENcIrUJy959k1sVNJN2u5kLuJ8PjzNg7w8_KBC1DOU3YmSWCYTbqReW8AOM5K4ZXO")' }}></div>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-ios-card-dark p-3 rounded-2xl shadow-ios">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-ios-orange">
                <span className="material-symbols-outlined filled">local_fire_department</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Current Streak</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">You're on a 12 day streak!</p>
              </div>
            </div>
          </div>

          {/* Completion Chart */}
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-6 shadow-ios flex flex-col items-center justify-center relative overflow-hidden group active:scale-[0.99] transition-transform duration-200 ease-out">
            <div className="flex justify-between w-full mb-4 items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Completion</h2>
              <span className="text-sm font-medium text-gray-400">Total</span>
            </div>
            <div className="relative size-48">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle className="text-gray-100 dark:text-gray-800" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeLinecap="round" strokeWidth="8"></circle>
                <defs>
                  <linearGradient id="gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#34C759"></stop>
                    <stop offset="100%" stopColor="#32ADE6"></stop>
                  </linearGradient>
                </defs>
                <circle className="drop-shadow-[0_0_4px_rgba(52,199,89,0.3)]" cx="50" cy="50" fill="none" r="42" stroke="url(#gradient)" strokeDasharray="263.8" strokeDashoffset="153" strokeLinecap="round" strokeWidth="8"></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">42<span className="text-xl align-top text-gray-400">%</span></span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center px-4 font-medium">Keep it up! You're nearly halfway.</p>
          </div>

          {/* Mini Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[20px] p-4 shadow-ios flex flex-col justify-between h-36 active:scale-[0.98] transition-transform duration-200">
              <div className="flex items-start justify-between">
                <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-full text-ios-blue">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
              </div>
              <div>
                <span className="text-3xl font-bold block text-gray-900 dark:text-white">14<span className="text-lg text-gray-400 font-medium ml-0.5">h</span></span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 block">Time Read</span>
              </div>
            </div>
            <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[20px] p-4 shadow-ios flex flex-col justify-between h-36 active:scale-[0.98] transition-transform duration-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-purple-100 dark:bg-purple-500/20 p-2 rounded-full text-purple-500">
                  <span className="material-symbols-outlined text-xl">menu_book</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 mt-1">
                <div>
                  <span className="text-xl font-bold block leading-none text-gray-900 dark:text-white">342</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Chapters</span>
                </div>
                <div className="w-full h-px bg-gray-100 dark:bg-gray-700/50"></div>
                <div>
                  <span className="text-xl font-bold block leading-none text-gray-900 dark:text-white">856</span>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Verses</span>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white px-1 mt-2">Up Next</h3>
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-4 shadow-ios flex gap-4 items-center relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
            <div className="h-20 w-20 shrink-0 rounded-[16px] bg-cover bg-center shadow-sm z-10" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCMWjgYlJFg08zod-j93L4lOCoQNJo1v5I3qKMfchpCGaQFRX7OAWwa8-974gL1LWUiMFunLpW-DTNgv2kMKlMPJ8mjLs7KxDNDhVr1kkcIANkZSxw3fdtzFsE3SR8y5i3zyfCHsBjcCiLCezY_4LmCtQfKoWKTsZaVFD6fPj2V8RrdWxXnDXR9tvo0Lr24S8E5sdM3TZwc5KypEB8Pyfmu4Ip8Kdbp4fqMAqwKoPuI_BCF8utk0NSzc993XdpDxaYA23Tqhouahvy7")' }}></div>
            <div className="flex flex-col flex-1 min-w-0 z-10">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">Psalms 23</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Continue Reading</p>
                </div>
                <button className="size-8 rounded-full bg-ios-bg-light dark:bg-gray-700 flex items-center justify-center text-primary shadow-sm active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-xl filled" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>
              </div>
              <div className="mt-auto">
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-3/4 shadow-[0_0_8px_rgba(52,199,89,0.5)]"></div>
                </div>
                <div className="flex justify-end text-[10px] font-semibold text-gray-400 mt-1">
                  <span>75%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-5 shadow-ios mt-2 mb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activity</h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">Last 7 Days</span>
            </div>
            <div className="flex items-end justify-between h-32 gap-3">
              {/* Activity Bars */}
              {[
                { day: 'M', h: '40%' }, { day: 'T', h: '65%' }, { day: 'W', h: '30%' },
                { day: 'T', h: '85%', active: true }, { day: 'F', h: '50%' },
                { day: 'S', h: '20%' }, { day: 'S', h: '95%' }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-full relative overflow-hidden">
                    <div
                      className={`absolute bottom-0 w-full rounded-full transition-colors ${item.active ? 'bg-primary shadow-[0_0_10px_rgba(52,199,89,0.3)]' : 'bg-primary/40 group-hover:bg-primary/60'}`}
                      style={{ height: item.h }}
                    ></div>
                  </div>
                  <span className={`text-[10px] font-semibold ${item.active ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400'}`}>{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Awards */}
          <div className="bg-ios-card-light dark:bg-ios-card-dark rounded-[24px] p-5 shadow-ios mb-4 mt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Awards</h3>
              <a className="text-ios-blue text-sm font-semibold active:opacity-60" href="#">See All</a>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
              <div className="flex flex-col items-center gap-2 min-w-[76px] group cursor-pointer">
                <div className="size-[68px] rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 shadow-sm border border-yellow-200/50 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-transform">
                  <div className="absolute inset-0 bg-white/10 rounded-full rotate-45 transform translate-y-1/2"></div>
                  <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">wb_sunny</span>
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2 w-full text-gray-600 dark:text-gray-300">Early Riser</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[76px] group cursor-pointer">
                <div className="size-[68px] rounded-full bg-gradient-to-b from-green-400 to-green-700 shadow-sm border border-green-200/50 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-transform">
                  <div className="absolute inset-0 bg-white/10 rounded-full rotate-45 transform translate-y-1/2"></div>
                  <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">auto_stories</span>
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2 w-full text-gray-600 dark:text-gray-300">Gospel Reader</span>
              </div>
              <div className="flex flex-col items-center gap-2 min-w-[76px] group cursor-pointer">
                <div className="size-[68px] rounded-full bg-gradient-to-b from-blue-300 to-blue-600 shadow-sm border border-blue-200/50 flex items-center justify-center relative overflow-hidden group-active:scale-95 transition-transform">
                  <div className="absolute inset-0 bg-white/10 rounded-full rotate-45 transform translate-y-1/2"></div>
                  <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">diversity_3</span>
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight line-clamp-2 w-full text-gray-600 dark:text-gray-300">Community</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProgressScreen;