'use client';

import React, { useState } from 'react';
import { Screen } from '../types';
import { useAuth } from '@/lib/auth-context';

interface SecurityScreenProps {
    navigate: (screen: Screen) => void;
}

const SecurityScreen: React.FC<SecurityScreenProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    // Mock recent activity data
    const loginHistory = [
        { id: 1, device: 'iPhone 15 Pro', location: 'Seoul, KR', time: '방금 전', status: 'active' },
        { id: 2, device: 'Chrome / Windows', location: 'Busan, KR', time: '3시간 전', status: 'inactive' },
        { id: 3, device: 'Safari / Mac', location: 'Seoul, KR', time: '어제', status: 'inactive' },
    ];

    return (
        <div className="bg-ios-bg-light dark:bg-ios-bg-dark min-h-screen pb-12 font-sans text-slate-900 dark:text-white">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-ios-bg-light/90 dark:bg-ios-bg-dark/90 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => navigate(Screen.SETTINGS)}
                        className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">보안 및 이메일</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-8">
                {/* Email Section */}
                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">이메일 계정</h2>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                                <span className="material-symbols-outlined">mark_email_read</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{user?.email}</p>
                                <p className="text-xs text-green-600 font-medium">인증됨</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Password Change */}
                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">비밀번호 변경</h2>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 shadow-sm space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">현재 비밀번호</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-ios-bg-light dark:bg-[#2C2C2E] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder="현재 비밀번호 입력"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-ios-bg-light dark:bg-[#2C2C2E] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                placeholder="8자 이상 입력"
                            />
                        </div>
                        <button className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                            비밀번호 업데이트
                        </button>
                    </div>
                </section>

                {/* 2FA Toggle (UI Only) */}
                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">추가 보안</h2>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] p-4 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">2단계 인증</p>
                                <p className="text-xs text-slate-500">로그인 시 추가 인증 요구</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                            className={`w-[51px] h-[31px] rounded-full flex items-center px-[2px] transition-colors ${is2FAEnabled ? 'bg-primary' : 'bg-[#E3E3E8] dark:bg-[#39393D]'}`}
                        >
                            <div className={`w-[27px] h-[27px] rounded-full bg-white shadow-md transition-transform ${is2FAEnabled ? 'translate-x-[20px]' : ''}`}></div>
                        </button>
                    </div>
                </section>

                {/* Login Activity */}
                <section>
                    <div className="mb-2 px-1">
                        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">최근 로그인 활동</h2>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-[18px] overflow-hidden shadow-sm divide-y divide-black/5 dark:divide-white/5">
                        {loginHistory.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">
                                        {item.device.toLowerCase().includes('phone') ? 'smartphone' : 'computer'}
                                    </span>
                                    <div>
                                        <p className="font-medium text-sm text-slate-900 dark:text-white">{item.device}</p>
                                        <p className="text-xs text-slate-500">{item.location} • {item.time}</p>
                                    </div>
                                </div>
                                {item.status === 'active' && (
                                    <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                        현재 기기
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default SecurityScreen;
