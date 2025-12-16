"use client";

import React, { useState } from 'react';

interface UrgentPrayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prayer: { title: string; content: string; requesterName?: string }) => Promise<void>;
}

export default function UrgentPrayerModal({ isOpen, onClose, onSubmit }: UrgentPrayerModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [requesterName, setRequesterName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsLoading(true);
        try {
            await onSubmit({ title, content, requesterName: requesterName || undefined });
            setTitle('');
            setContent('');
            setRequesterName('');
            onClose();
        } catch (error) {
            console.error('Failed to send prayer:', error);
            alert('기도 요청 전송에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl overflow-hidden animate-pop">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-green-400 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-white text-3xl">🙏</span>
                        <div>
                            <h2 className="text-xl font-bold text-white">긴급 기도 요청</h2>
                            <p className="text-white/80 text-sm">모든 성도에게 푸시 알림이 전송됩니다</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="예: 김OO 집사님의 빠른 쾌유를 위해"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            기도 내용 *
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="자세한 기도 제목을 입력해주세요..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            요청자 이름 (선택)
                        </label>
                        <input
                            type="text"
                            value={requesterName}
                            onChange={(e) => setRequesterName(e.target.value)}
                            placeholder="비워두면 익명으로 표시됩니다"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !title.trim() || !content.trim()}
                            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold shadow-lg shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    전송 중...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">send</span>
                                    기도 요청 전송
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
