'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface AdminScreenProps {
    navigate: (screen: Screen) => void;
    t: Translations;
}

interface Cell {
    id: string;
    name: string;
    invite_code: string;
    member_count?: number;
}

interface Member {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface UrgentPrayer {
    id: string;
    title: string;
    content: string;
    is_active: boolean;
    created_at: string;
}

const AdminScreen: React.FC<AdminScreenProps> = ({ navigate, t }) => {
    const { user, profile, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<'cells' | 'members' | 'prayers'>('cells');
    const [cells, setCells] = useState<Cell[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [prayers, setPrayers] = useState<UrgentPrayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateCell, setShowCreateCell] = useState(false);
    const [showCreatePrayer, setShowCreatePrayer] = useState(false);
    const [newCellName, setNewCellName] = useState('');
    const [newPrayerTitle, setNewPrayerTitle] = useState('');
    const [newPrayerContent, setNewPrayerContent] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            // Fetch cells with member counts
            const { data: cellsData } = await supabase.from('cells').select('*').order('name');
            if (cellsData) {
                // Get member counts for each cell
                const cellsWithCounts = await Promise.all(
                    cellsData.map(async (cell: { id: string; name: string; invite_code: string }) => {
                        const { count } = await supabase
                            .from('cell_members')
                            .select('*', { count: 'exact', head: true })
                            .eq('cell_id', cell.id);
                        return { ...cell, member_count: count || 0 };
                    })
                );
                setCells(cellsWithCounts);
            }

            // Fetch all members
            const { data: membersData } = await supabase.from('profiles').select('*').order('name');
            if (membersData) {
                setMembers(membersData);
            }

            // Fetch urgent prayers
            const { data: prayersData } = await supabase
                .from('urgent_prayers')
                .select('*')
                .order('created_at', { ascending: false });
            if (prayersData) {
                setPrayers(prayersData);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const handleCreateCell = async () => {
        if (!newCellName.trim()) return;

        const inviteCode = newCellName.toUpperCase().replace(/\s+/g, '_').slice(0, 10);
        const { error } = await supabase.from('cells').insert({
            name: newCellName,
            invite_code: inviteCode,
        });

        if (!error) {
            setNewCellName('');
            setShowCreateCell(false);
            // Refresh cells
            const { data } = await supabase.from('cells').select('*').order('name');
            if (data) setCells(data);
        }
    };

    const handleCreatePrayer = async () => {
        if (!newPrayerTitle.trim() || !newPrayerContent.trim()) return;

        const { error } = await supabase.from('urgent_prayers').insert({
            title: newPrayerTitle,
            content: newPrayerContent,
            requester_name: profile?.name || 'Admin',
            created_by: user?.id,
            is_active: true,
        });

        if (!error) {
            setNewPrayerTitle('');
            setNewPrayerContent('');
            setShowCreatePrayer(false);
            // Refresh prayers
            const { data } = await supabase
                .from('urgent_prayers')
                .select('*')
                .order('created_at', { ascending: false });
            if (data) setPrayers(data);
        }
    };

    const handleTogglePrayer = async (id: string, isActive: boolean) => {
        await supabase.from('urgent_prayers').update({ is_active: !isActive }).eq('id', id);
        setPrayers(prayers.map((p) => (p.id === id ? { ...p, is_active: !isActive } : p)));
    };

    const handleUpdateRole = async (memberId: string, newRole: string) => {
        await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
        setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'PASTOR': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'LEADER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    // Access control
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24 flex items-center justify-center">
                <div className="text-center px-6">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-red-500">block</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        이 페이지는 관리자 전용입니다
                    </p>
                    <button
                        onClick={() => navigate(Screen.DASHBOARD)}
                        className="px-6 py-3 bg-primary text-white rounded-full font-medium"
                    >
                        홈으로 이동
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400">관리자 데이터를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between px-5 py-4">
                    <button
                        onClick={() => navigate(Screen.DASHBOARD)}
                        className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">관리자</h1>
                    <div className="w-10"></div>
                </div>

                {/* Tabs */}
                <div className="flex border-t border-black/5 dark:border-white/10">
                    {[
                        { key: 'cells', label: '셀 관리', icon: 'groups' },
                        { key: 'members', label: '멤버', icon: 'person' },
                        { key: 'prayers', label: '기도', icon: 'favorite' },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as 'cells' | 'members' | 'prayers')}
                            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${activeTab === tab.key
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-5">
                {/* Cells Tab */}
                {activeTab === 'cells' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowCreateCell(true)}
                            className="w-full py-3 bg-primary text-white rounded-2xl font-medium flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">add</span>
                            새 셀 만들기
                        </button>

                        {cells.map((cell) => (
                            <div key={cell.id} className="p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{cell.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            초대 코드: {cell.invite_code}
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 bg-primary/10 rounded-full">
                                        <span className="text-sm font-medium text-primary">{cell.member_count}명</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div key={member.id} className="p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {member.name.slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold truncate">{member.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{member.email}</p>
                                    </div>
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer ${getRoleBadgeColor(member.role)}`}
                                    >
                                        <option value="MEMBER">멤버</option>
                                        <option value="LEADER">리더</option>
                                        <option value="PASTOR">목사</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Prayers Tab */}
                {activeTab === 'prayers' && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowCreatePrayer(true)}
                            className="w-full py-3 bg-red-500 text-white rounded-2xl font-medium flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">priority_high</span>
                            긴급 기도 요청
                        </button>

                        {prayers.map((prayer) => (
                            <div
                                key={prayer.id}
                                className={`p-4 rounded-2xl shadow-sm ${prayer.is_active
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                    : 'bg-surface-light dark:bg-surface-dark opacity-60'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{prayer.title}</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{prayer.content}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {new Date(prayer.created_at).toLocaleDateString('ko-KR')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleTogglePrayer(prayer.id, prayer.is_active)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${prayer.is_active ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                    >
                                        {prayer.is_active ? '활성' : '종료'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Cell Modal */}
            {showCreateCell && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">새 셀 만들기</h3>
                        <input
                            type="text"
                            placeholder="셀 이름"
                            value={newCellName}
                            onChange={(e) => setNewCellName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateCell(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreateCell}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-medium"
                            >
                                만들기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Prayer Modal */}
            {showCreatePrayer && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4">긴급 기도 요청</h3>
                        <input
                            type="text"
                            placeholder="제목"
                            value={newPrayerTitle}
                            onChange={(e) => setNewPrayerTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3"
                        />
                        <textarea
                            placeholder="기도 내용"
                            value={newPrayerContent}
                            onChange={(e) => setNewPrayerContent(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 resize-none"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreatePrayer(false)}
                                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreatePrayer}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
                            >
                                보내기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminScreen;
