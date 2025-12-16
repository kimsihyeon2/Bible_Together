'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Translations } from '@/i18n';

interface ProfileManagerProps {
    t: Translations;
    onClose?: () => void;
}

export function ProfileManager({ t, onClose }: ProfileManagerProps) {
    const { profile, user, updateProfile, signOut } = useAuth();
    const [name, setName] = useState(profile?.name || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        const { error: updateError } = await updateProfile({
            name: name.trim(),
            phone: phone.trim() || undefined,
        });

        if (updateError) {
            setError('프로필 업데이트에 실패했습니다.');
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }

        setLoading(false);
    };

    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'PASTOR': return '목사 / 관리자';
            case 'LEADER': return '셀 리더';
            default: return '셀원';
        }
    };

    const getRoleBadgeColor = (role?: string) => {
        switch (role) {
            case 'PASTOR': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
            case 'LEADER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (!user || !profile) {
        return (
            <div className="text-center p-8 text-text-sub">
                로그인이 필요합니다.
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">프로필 관리</h2>
                    {onClose && (
                        <button onClick={onClose} className="text-white/80 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Avatar */}
            <div className="flex flex-col items-center -mt-10 mb-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white dark:border-surface-dark">
                    {profile.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                    {getRoleLabel(profile.role)}
                </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm">
                        프로필이 업데이트되었습니다! ✓
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                        이메일
                    </label>
                    <input
                        type="email"
                        value={user.email || ''}
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-text-sub cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                        이름 *
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                        className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                        전화번호
                    </label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                    {loading ? '저장 중...' : '프로필 저장'}
                </button>

                <button
                    type="button"
                    onClick={signOut}
                    className="w-full py-3 rounded-xl border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                    로그아웃
                </button>
            </form>
        </div>
    );
}
