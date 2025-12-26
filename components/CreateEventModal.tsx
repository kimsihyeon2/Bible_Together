'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cellId: string | null;
    parishId: string | null;
    selectedDate?: Date | null;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    cellId,
    parishId,
    selectedDate
}) => {
    const { user, profile } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [scope, setScope] = useState<'GLOBAL' | 'PARISH' | 'CELL'>('CELL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isAdmin = profile?.role === 'PASTOR' || profile?.role === 'SUB_ADMIN';
    const isLeader = profile?.role === 'LEADER';

    useEffect(() => {
        if (isOpen) {
            // Set default date to selected date or today
            const date = selectedDate || new Date();
            setEventDate(date.toISOString().split('T')[0]);

            // Set default scope based on role
            if (isAdmin) {
                setScope('GLOBAL');
            } else if (isLeader) {
                setScope('CELL');
            }
        }
    }, [isOpen, selectedDate, isAdmin, isLeader]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !eventDate) {
            setError('제목과 날짜는 필수입니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const eventData: any = {
                title: title.trim(),
                description: description.trim() || null,
                event_date: eventDate,
                event_time: eventTime || null,
                end_time: endTime || null,
                location: location.trim() || null,
                scope,
                created_by: user?.id,
            };

            // Set scope-specific IDs
            if (scope === 'CELL' && cellId) {
                eventData.cell_id = cellId;
            } else if (scope === 'PARISH' && parishId) {
                eventData.parish_id = parishId;
            }

            const { error: insertError } = await supabase
                .from('calendar_events')
                .insert(eventData);

            if (insertError) throw insertError;

            // Reset form
            setTitle('');
            setDescription('');
            setEventTime('');
            setEndTime('');
            setLocation('');

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating event:', err);
            setError(err.message || '이벤트 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-primary p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined">event</span>
                        새 이벤트 추가
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                            제목 *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="이벤트 제목"
                            className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                            설명
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="이벤트 상세 설명 (선택)"
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                            날짜 *
                        </label>
                        <input
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                                시작 시간
                            </label>
                            <input
                                type="time"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                                종료 시간
                            </label>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-1">
                            장소
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="장소 (선택)"
                            className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Scope Selection */}
                    <div>
                        <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
                            공개 범위
                        </label>
                        <div className="flex gap-2">
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => setScope('GLOBAL')}
                                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${scope === 'GLOBAL'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    전체
                                </button>
                            )}
                            {(isAdmin || isLeader) && parishId && (
                                <button
                                    type="button"
                                    onClick={() => setScope('PARISH')}
                                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${scope === 'PARISH'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    교구
                                </button>
                            )}
                            {cellId && (
                                <button
                                    type="button"
                                    onClick={() => setScope('CELL')}
                                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${scope === 'CELL'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    셀
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {scope === 'GLOBAL' && '모든 성도에게 표시됩니다'}
                            {scope === 'PARISH' && '해당 교구 인원에게만 표시됩니다'}
                            {scope === 'CELL' && '해당 셀 인원에게만 표시됩니다'}
                        </p>
                    </div>

                    {/* Buttons */}
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
                            {loading ? '등록 중...' : '이벤트 등록'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
