'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

// Helper to format date as YYYY-MM-DD without timezone issues
const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userCellId: string | null;
    userParishId: string | null;
    selectedDate?: Date | null;
}

interface Parish {
    id: string;
    name: string;
}

interface Cell {
    id: string;
    name: string;
    parish_id: string;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    userCellId,
    userParishId,
    selectedDate
}) => {
    const { user, profile } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [scope, setScope] = useState<'GLOBAL' | 'PARISH' | 'CELL'>('CELL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [allParishes, setAllParishes] = useState<Parish[]>([]);
    const [allCells, setAllCells] = useState<Cell[]>([]);
    const [filteredCells, setFilteredCells] = useState<Cell[]>([]);
    const [selectedParishId, setSelectedParishId] = useState<string>('');
    const [selectedCellId, setSelectedCellId] = useState<string>('');

    const isAdmin = profile?.role === 'PASTOR' || profile?.role === 'SUB_ADMIN';
    const isPastor = profile?.role === 'PASTOR';
    const isLeader = profile?.role === 'LEADER';

    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;

            if (isPastor) {
                const [parishRes, cellRes] = await Promise.all([
                    supabase.from('parishes').select('id, name').order('name'),
                    supabase.from('cells').select('id, name, parish_id').order('name')
                ]);
                if (parishRes.data) setAllParishes(parishRes.data);
                if (cellRes.data) setAllCells(cellRes.data);
            } else if (profile?.role === 'SUB_ADMIN' && userParishId) {
                const [parishRes, cellRes] = await Promise.all([
                    supabase.from('parishes').select('id, name').eq('id', userParishId),
                    supabase.from('cells').select('id, name, parish_id').eq('parish_id', userParishId).order('name')
                ]);
                if (parishRes.data) setAllParishes(parishRes.data);
                if (cellRes.data) setAllCells(cellRes.data);
            } else if (isLeader && userCellId) {
                const { data: cellData } = await supabase
                    .from('cells')
                    .select('id, name, parish_id')
                    .eq('id', userCellId);
                if (cellData) setAllCells(cellData);
            }
        };
        fetchData();
    }, [isOpen, isPastor, isLeader, profile?.role, userParishId, userCellId]);

    useEffect(() => {
        if (scope === 'CELL') {
            if (selectedParishId) {
                setFilteredCells(allCells.filter(c => c.parish_id === selectedParishId));
            } else {
                setFilteredCells(allCells);
            }
        }
    }, [selectedParishId, allCells, scope]);

    useEffect(() => {
        if (isOpen) {
            const date = selectedDate || new Date();
            const dateStr = formatLocalDate(date);
            setStartDate(dateStr);
            setEndDate(''); // Default empty, will default to start_date

            if (isPastor) {
                setScope('GLOBAL');
            } else if (profile?.role === 'SUB_ADMIN') {
                setScope('PARISH');
                if (userParishId) setSelectedParishId(userParishId);
            } else if (isLeader) {
                setScope('CELL');
                if (userCellId) setSelectedCellId(userCellId);
            }
        }
    }, [isOpen, selectedDate, isPastor, isLeader, profile?.role, userParishId, userCellId]);

    useEffect(() => {
        if (scope === 'GLOBAL') {
            setSelectedParishId('');
            setSelectedCellId('');
        } else if (scope === 'PARISH') {
            setSelectedCellId('');
            if (profile?.role === 'SUB_ADMIN' && userParishId) {
                setSelectedParishId(userParishId);
            }
        } else if (scope === 'CELL') {
            if (isLeader && userCellId) {
                setSelectedCellId(userCellId);
                setSelectedParishId('');
            }
        }
    }, [scope, profile?.role, userParishId, userCellId, isLeader]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !startDate) {
            setError('제목과 시작 날짜는 필수입니다.');
            return;
        }

        if (scope === 'PARISH' && !selectedParishId) {
            setError('교구를 선택해주세요.');
            return;
        }
        if (scope === 'CELL' && !selectedCellId) {
            setError('셀을 선택해주세요.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const eventData: any = {
                title: title.trim(),
                description: description.trim() || null,
                start_date: startDate,
                end_date: endDate || startDate, // Default to start_date if not provided
                event_date: startDate, // Keep for backward compatibility
                event_time: eventTime || null,
                end_time: endTime || null,
                location: location.trim() || null,
                scope,
                created_by: user?.id,
            };

            if (scope === 'PARISH' && selectedParishId) {
                eventData.parish_id = selectedParishId;
            } else if (scope === 'CELL' && selectedCellId) {
                eventData.cell_id = selectedCellId;
            }

            const { error: insertError } = await supabase
                .from('calendar_events')
                .insert(eventData);

            if (insertError) throw insertError;

            setTitle('');
            setDescription('');
            setEventTime('');
            setEndTime('');
            setLocation('');
            setEndDate('');

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error creating event:', err);
            setError(err.message || '이벤트 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getSelectedParishName = () => allParishes.find(p => p.id === selectedParishId)?.name || '';
    const getSelectedCellName = () => allCells.find(c => c.id === selectedCellId)?.name || '';

    const getScopeDescription = () => {
        switch (scope) {
            case 'GLOBAL': return '✨ 전체 성도에게 표시됩니다';
            case 'PARISH': return selectedParishId ? `📍 ${getSelectedParishName()} 교구 인원에게 표시됩니다` : '⚠️ 교구를 선택해주세요';
            case 'CELL': return selectedCellId ? `👥 ${getSelectedCellName()} 셀 인원에게 표시됩니다` : '⚠️ 셀을 선택해주세요';
            default: return '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-primary p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined">add_circle</span>
                        새 이벤트 추가
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-white">close</span>
                    </button>
                </div>

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
                                placeholder="이벤트 제목"
                                className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium mb-1">설명</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="이벤트 상세 설명 (선택)"
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
                                            // If end date is before start date, reset it
                                            if (endDate && e.target.value > endDate) {
                                                setEndDate('');
                                            }
                                        }}
                                        className="w-full px-3 py-2.5 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">종료 날짜</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        min={startDate}
                                        placeholder="당일"
                                        className="w-full px-3 py-2.5 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">종료 날짜를 비워두면 당일 이벤트로 처리됩니다</p>
                        </div>

                        {/* Time (Optional) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">시작 시간 (선택)</label>
                                <input
                                    type="time"
                                    value={eventTime}
                                    onChange={(e) => setEventTime(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">종료 시간 (선택)</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark"
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

                        {/* Scope Selection */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium">공개 범위</label>
                            <div className="flex gap-2">
                                {isPastor && (
                                    <button type="button" onClick={() => setScope('GLOBAL')}
                                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${scope === 'GLOBAL' ? 'bg-purple-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        🌐 전체
                                    </button>
                                )}
                                {isAdmin && (
                                    <button type="button" onClick={() => setScope('PARISH')}
                                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${scope === 'PARISH' ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                        🏛️ 교구
                                    </button>
                                )}
                                <button type="button" onClick={() => setScope('CELL')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${scope === 'CELL' ? 'bg-green-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    👥 셀
                                </button>
                            </div>

                            {scope === 'PARISH' && (
                                <select value={selectedParishId} onChange={(e) => setSelectedParishId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20"
                                    disabled={profile?.role === 'SUB_ADMIN'}>
                                    <option value="">교구를 선택하세요</option>
                                    {allParishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            )}

                            {scope === 'CELL' && (
                                <div className="space-y-2">
                                    {isPastor && (
                                        <select value={selectedParishId} onChange={(e) => { setSelectedParishId(e.target.value); setSelectedCellId(''); }}
                                            className="w-full px-4 py-3 rounded-xl border border-divider bg-white dark:bg-background-dark">
                                            <option value="">모든 교구</option>
                                            {allParishes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    )}
                                    <select value={selectedCellId} onChange={(e) => setSelectedCellId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-green-200 bg-green-50 dark:bg-green-900/20"
                                        disabled={isLeader}>
                                        <option value="">셀을 선택하세요</option>
                                        {(isPastor ? filteredCells : allCells).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className={`p-3 rounded-lg text-sm font-medium ${scope === 'GLOBAL' ? 'bg-purple-50 text-purple-700' : scope === 'PARISH' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                {getScopeDescription()}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-divider bg-white dark:bg-surface-dark">
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl border border-divider font-medium hover:bg-gray-50 transition-colors">
                                취소
                            </button>
                            <button type="submit" disabled={loading || (scope === 'PARISH' && !selectedParishId) || (scope === 'CELL' && !selectedCellId)}
                                className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold disabled:opacity-50">
                                {loading ? '등록 중...' : '이벤트 등록'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
