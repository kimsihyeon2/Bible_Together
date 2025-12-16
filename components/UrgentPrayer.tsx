'use client';

import React, { useState, useEffect } from 'react';
import { supabase, UrgentPrayer, createUrgentPrayer } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface UrgentPrayerListProps {
    onClose?: () => void;
}

export function UrgentPrayerList({ onClose }: UrgentPrayerListProps) {
    const [prayers, setPrayers] = useState<UrgentPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth();

    useEffect(() => {
        fetchPrayers();
    }, []);

    const fetchPrayers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('urgent_prayers')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setPrayers(data as UrgentPrayer[]);
        }
        setLoading(false);
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        return `${days}일 전`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-main dark:text-white flex items-center gap-2">
                    <span className="text-2xl">🙏</span>
                    긴급 기도 요청
                </h3>
                {onClose && (
                    <button onClick={onClose} className="text-text-sub hover:text-text-main">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            {prayers.length === 0 ? (
                <p className="text-center text-text-sub py-8">
                    현재 긴급 기도 요청이 없습니다.
                </p>
            ) : (
                <div className="space-y-3">
                    {prayers.map((prayer) => (
                        <div
                            key={prayer.id}
                            className="bg-background-light dark:bg-background-dark rounded-xl p-4 border-l-4 border-primary"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-text-main dark:text-white">
                                    {prayer.title}
                                </h4>
                                <span className="text-xs text-text-sub">
                                    {formatTime(prayer.created_at)}
                                </span>
                            </div>
                            <p className="text-sm text-text-sub dark:text-gray-300 mb-2">
                                {prayer.content}
                            </p>
                            {prayer.requester_name && (
                                <p className="text-xs text-primary font-medium">
                                    요청자: {prayer.requester_name}
                                </p>
                            )}
                            <button className="mt-3 w-full bg-primary/10 text-primary py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                                함께 기도하기 🙏
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Modal for creating urgent prayer (Admin only)
interface CreatePrayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateUrgentPrayerModal({ isOpen, onClose, onSuccess }: CreatePrayerModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [requesterName, setRequesterName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError('제목과 내용을 입력해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        const { error: submitError } = await createUrgentPrayer({
            title: title.trim(),
            content: content.trim(),
            requester_name: requesterName.trim() || undefined,
        });

        if (submitError) {
            setError('기도 요청 등록에 실패했습니다.');
        } else {
            setTitle('');
            setContent('');
            setRequesterName('');
            onSuccess?.();
            onClose();
        }

        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-primary p-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>🙏</span> 긴급 기도 요청 등록
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="기도 제목을 입력하세요"
                            className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                            내용 *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="기도 내용을 자세히 입력하세요"
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                            요청자 이름 (선택)
                        </label>
                        <input
                            type="text"
                            value={requesterName}
                            onChange={(e) => setRequesterName(e.target.value)}
                            placeholder="익명으로 남기려면 비워두세요"
                            className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-divider dark:border-gray-600 text-text-sub hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? '등록 중...' : '기도 요청 등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
