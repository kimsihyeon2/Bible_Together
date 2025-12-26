'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    event_date?: string; // Legacy
    event_time?: string;
    end_time?: string;
    location?: string;
    scope: 'GLOBAL' | 'PARISH' | 'CELL';
    parish_id?: string;
    cell_id?: string;
    created_by: string;
}

interface EditEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    event: CalendarEvent | null;
    userRole: string;
    userId: string;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    event,
    userRole,
    userId
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const isPastor = userRole === 'PASTOR';
    const isSubAdmin = userRole === 'SUB_ADMIN';
    const isLeader = userRole === 'LEADER';

    // Check if user can edit this event
    const canEdit = () => {
        if (!event) return false;

        // Creator can always edit
        if (event.created_by === userId) return true;

        // PASTOR can edit anything
        if (isPastor) return true;

        // SUB_ADMIN can edit PARISH and CELL events (not GLOBAL)
        if (isSubAdmin && event.scope !== 'GLOBAL') return true;

        // LEADER can only edit their own CELL events
        if (isLeader && event.scope === 'CELL' && event.created_by === userId) return true;

        return false;
    };

    // Populate form when event changes
    useEffect(() => {
        if (isOpen && event) {
            setTitle(event.title || '');
            setDescription(event.description || '');
            setStartDate(event.start_date || event.event_date || '');
            setEndDate(event.end_date || event.start_date || event.event_date || '');
            setEventTime(event.event_time || '');
            setEndTime(event.end_time || '');
            setLocation(event.location || '');
            setError('');
            setShowDeleteConfirm(false);
        }
    }, [isOpen, event]);

    if (!isOpen || !event) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !startDate) {
            setError('제목과 시작 날짜는 필수입니다.');
            return;
        }

        if (!canEdit()) {
            setError('이 이벤트를 수정할 권한이 없습니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: updateError } = await supabase
                .from('calendar_events')
                .update({
                    title: title.trim(),
                    description: description.trim() || null,
                    start_date: startDate,
                    end_date: endDate || startDate,
                    event_date: startDate, // Keep for backward compatibility
                    event_time: eventTime || null,
                    end_time: endTime || null,
                    location: location.trim() || null,
                })
                .eq('id', event.id);

            if (updateError) throw updateError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error updating event:', err);
            setError(err.message || '이벤트 수정에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!canEdit()) {
            setError('이 이벤트를 삭제할 권한이 없습니다.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: deleteError } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', event.id);

            if (deleteError) throw deleteError;

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error deleting event:', err);
            setError(err.message || '이벤트 삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getScopeBadge = () => {
        switch (event.scope) {
            case 'GLOBAL': return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">🌐 전체</span>;
            case 'PARISH': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">🏛️ 교구</span>;
            case 'CELL': return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">👥 셀</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-amber-500 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-white">edit_calendar</span>
                        <h2 className="text-lg font-bold text-white">이벤트 수정</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {getScopeBadge()}
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-white">close</span>
                        </button>
                    </div>
                </div>

                {!canEdit() ? (
                    <div className="p-6 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">lock</span>
                        <p className="text-slate-600 dark:text-slate-400">이 이벤트를 수정할 권한이 없습니다.</p>
                        <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                            닫기
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="max-h-[55vh] overflow-y-auto p-4 space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium mb-1">제목 *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium mb-1">설명</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark resize-none"
                                />
                            </div>

                            {/* Date Range */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">날짜</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">시작 날짜 *</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => {
                                                setStartDate(e.target.value);
                                                if (endDate && e.target.value > endDate) setEndDate('');
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-amber-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">종료 날짜</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            min={startDate}
                                            className="w-full px-3 py-2.5 rounded-xl border border-divider bg-white dark:bg-background-dark"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">시작 시간</label>
                                    <input
                                        type="time"
                                        value={eventTime}
                                        onChange={(e) => setEventTime(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-divider bg-white dark:bg-background-dark"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">종료 시간</label>
                                    <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-divider bg-white dark:bg-background-dark"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium mb-1">장소</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="장소 (선택)"
                                    className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark"
                                />
                            </div>

                            {/* Delete Section */}
                            <div className="pt-2 border-t border-divider">
                                {!showDeleteConfirm ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                        이벤트 삭제
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-center text-sm text-red-600 font-medium">정말 삭제하시겠습니까?</p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-sm font-medium"
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDelete}
                                                disabled={loading}
                                                className="flex-1 py-2.5 bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                                            >
                                                {loading ? '삭제 중...' : '삭제 확인'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="p-4 border-t border-divider bg-white dark:bg-surface-dark">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3.5 rounded-xl border border-divider font-medium hover:bg-gray-50 transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {loading ? '저장 중...' : '수정 완료'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditEventModal;
