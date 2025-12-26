'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userCellId: string | null;  // User's own cell
    userParishId: string | null; // User's own parish
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
    const [eventDate, setEventDate] = useState('');
    const [eventTime, setEventTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [location, setLocation] = useState('');
    const [scope, setScope] = useState<'GLOBAL' | 'PARISH' | 'CELL'>('CELL');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Available options based on role
    const [allParishes, setAllParishes] = useState<Parish[]>([]);
    const [allCells, setAllCells] = useState<Cell[]>([]);
    const [filteredCells, setFilteredCells] = useState<Cell[]>([]);

    // Selected values
    const [selectedParishId, setSelectedParishId] = useState<string>('');
    const [selectedCellId, setSelectedCellId] = useState<string>('');

    const isAdmin = profile?.role === 'PASTOR' || profile?.role === 'SUB_ADMIN';
    const isPastor = profile?.role === 'PASTOR';
    const isLeader = profile?.role === 'LEADER';

    // Fetch parishes and cells based on role
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen) return;

            // Admin (PASTOR) can see all parishes and cells
            if (isPastor) {
                const [parishRes, cellRes] = await Promise.all([
                    supabase.from('parishes').select('id, name').order('name'),
                    supabase.from('cells').select('id, name, parish_id').order('name')
                ]);
                if (parishRes.data) setAllParishes(parishRes.data);
                if (cellRes.data) setAllCells(cellRes.data);
            }
            // SUB_ADMIN can see their parish and its cells
            else if (profile?.role === 'SUB_ADMIN' && userParishId) {
                const [parishRes, cellRes] = await Promise.all([
                    supabase.from('parishes').select('id, name').eq('id', userParishId),
                    supabase.from('cells').select('id, name, parish_id').eq('parish_id', userParishId).order('name')
                ]);
                if (parishRes.data) setAllParishes(parishRes.data);
                if (cellRes.data) setAllCells(cellRes.data);
            }
            // LEADER can only see their cell
            else if (isLeader && userCellId) {
                const { data: cellData } = await supabase
                    .from('cells')
                    .select('id, name, parish_id')
                    .eq('id', userCellId);
                if (cellData) setAllCells(cellData);
            }
        };

        fetchData();
    }, [isOpen, isPastor, isLeader, profile?.role, userParishId, userCellId]);

    // Filter cells when parish changes
    useEffect(() => {
        if (scope === 'CELL') {
            if (selectedParishId) {
                setFilteredCells(allCells.filter(c => c.parish_id === selectedParishId));
            } else {
                setFilteredCells(allCells);
            }
        }
    }, [selectedParishId, allCells, scope]);

    // Set defaults when modal opens
    useEffect(() => {
        if (isOpen) {
            const date = selectedDate || new Date();
            setEventDate(date.toISOString().split('T')[0]);

            // Set default scope based on role
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

    // Reset selections when scope changes
    useEffect(() => {
        if (scope === 'GLOBAL') {
            setSelectedParishId('');
            setSelectedCellId('');
        } else if (scope === 'PARISH') {
            setSelectedCellId('');
            // For SUB_ADMIN, auto-select their parish
            if (profile?.role === 'SUB_ADMIN' && userParishId) {
                setSelectedParishId(userParishId);
            }
        } else if (scope === 'CELL') {
            // For LEADER, auto-select their cell
            if (isLeader && userCellId) {
                setSelectedCellId(userCellId);
                setSelectedParishId('');
            }
        }
    }, [scope, profile?.role, userParishId, userCellId, isLeader]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !eventDate) {
            setError('제목과 날짜는 필수입니다.');
            return;
        }

        // Validate scope-specific selections
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
                event_date: eventDate,
                event_time: eventTime || null,
                end_time: endTime || null,
                location: location.trim() || null,
                scope,
                created_by: user?.id,
            };

            // Set scope-specific IDs
            if (scope === 'PARISH' && selectedParishId) {
                eventData.parish_id = selectedParishId;
            } else if (scope === 'CELL' && selectedCellId) {
                eventData.cell_id = selectedCellId;
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

    const getSelectedParishName = () => {
        const parish = allParishes.find(p => p.id === selectedParishId);
        return parish?.name || '';
    };

    const getSelectedCellName = () => {
        const cell = allCells.find(c => c.id === selectedCellId);
        return cell?.name || '';
    };

    const getScopeDescription = () => {
        switch (scope) {
            case 'GLOBAL':
                return '✨ 전체 성도에게 표시됩니다';
            case 'PARISH':
                return selectedParishId
                    ? `📍 ${getSelectedParishName()} 교구 인원에게 표시됩니다`
                    : '⚠️ 교구를 선택해주세요';
            case 'CELL':
                return selectedCellId
                    ? `👥 ${getSelectedCellName()} 셀 인원에게 표시됩니다`
                    : '⚠️ 셀을 선택해주세요';
            default:
                return '';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-primary p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
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

                <form onSubmit={handleSubmit}>
                    {/* Scrollable Content */}
                    <div className="max-h-[55vh] overflow-y-auto p-4 space-y-4">
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
                                rows={2}
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
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-text-main dark:text-white">
                                공개 범위
                            </label>

                            {/* Scope Type Buttons */}
                            <div className="flex gap-2">
                                {/* GLOBAL - Only PASTOR */}
                                {isPastor && (
                                    <button
                                        type="button"
                                        onClick={() => setScope('GLOBAL')}
                                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${scope === 'GLOBAL'
                                            ? 'bg-purple-500 text-white shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        🌐 전체
                                    </button>
                                )}

                                {/* PARISH - PASTOR and SUB_ADMIN */}
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setScope('PARISH')}
                                        className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${scope === 'PARISH'
                                            ? 'bg-blue-500 text-white shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        🏛️ 교구
                                    </button>
                                )}

                                {/* CELL - Everyone with permission */}
                                <button
                                    type="button"
                                    onClick={() => setScope('CELL')}
                                    className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${scope === 'CELL'
                                        ? 'bg-green-500 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    👥 셀
                                </button>
                            </div>

                            {/* Parish Selector - For PARISH scope (PASTOR can select any) */}
                            {scope === 'PARISH' && (
                                <div className="animate-fadeIn">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        교구 선택
                                    </label>
                                    <select
                                        value={selectedParishId}
                                        onChange={(e) => setSelectedParishId(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-text-main dark:text-white focus:ring-2 focus:ring-blue-500"
                                        disabled={profile?.role === 'SUB_ADMIN'} // SUB_ADMIN can't change their parish
                                    >
                                        <option value="">교구를 선택하세요</option>
                                        {allParishes.map(parish => (
                                            <option key={parish.id} value={parish.id}>
                                                {parish.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Cell Selector - For CELL scope */}
                            {scope === 'CELL' && (
                                <div className="space-y-2 animate-fadeIn">
                                    {/* Parish filter for PASTOR */}
                                    {isPastor && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">
                                                교구 필터 (선택)
                                            </label>
                                            <select
                                                value={selectedParishId}
                                                onChange={(e) => {
                                                    setSelectedParishId(e.target.value);
                                                    setSelectedCellId(''); // Reset cell when parish changes
                                                }}
                                                className="w-full px-4 py-3 rounded-xl border border-divider dark:border-gray-600 bg-white dark:bg-background-dark text-text-main dark:text-white"
                                            >
                                                <option value="">모든 교구</option>
                                                {allParishes.map(parish => (
                                                    <option key={parish.id} value={parish.id}>
                                                        {parish.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Cell selector */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">
                                            셀 선택
                                        </label>
                                        <select
                                            value={selectedCellId}
                                            onChange={(e) => setSelectedCellId(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-text-main dark:text-white focus:ring-2 focus:ring-green-500"
                                            disabled={isLeader} // LEADER can't change their cell
                                        >
                                            <option value="">셀을 선택하세요</option>
                                            {(isPastor ? filteredCells : allCells).map(cell => (
                                                <option key={cell.id} value={cell.id}>
                                                    {cell.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Scope Description */}
                            <div className={`p-3 rounded-lg text-sm font-medium ${scope === 'GLOBAL' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' :
                                    scope === 'PARISH' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                                        'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                }`}>
                                {getScopeDescription()}
                            </div>
                        </div>
                    </div>

                    {/* Fixed Button Area */}
                    <div className="p-4 border-t border-divider dark:border-gray-700 bg-white dark:bg-surface-dark">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl border border-divider dark:border-gray-600 text-text-sub font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (scope === 'PARISH' && !selectedParishId) || (scope === 'CELL' && !selectedCellId)}
                                className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
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
