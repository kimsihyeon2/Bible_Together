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
    const [activeTab, setActiveTab] = useState<'parishes' | 'members' | 'prayers'>('parishes');
    const [parishes, setParishes] = useState<any[]>([]);
    const [selectedParishId, setSelectedParishId] = useState<string | null>(null);
    const [cells, setCells] = useState<any[]>([]); // Cells within selected Parish
    const [members, setMembers] = useState<any[]>([]);
    const [prayers, setPrayers] = useState<UrgentPrayer[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showCreateParish, setShowCreateParish] = useState(false);
    const [newParishName, setNewParishName] = useState('');
    const [newParishCode, setNewParishCode] = useState('');

    const [showCreateCell, setShowCreateCell] = useState(false);
    const [newCellName, setNewCellName] = useState('');
    const [newCellCode, setNewCellCode] = useState('');

    const [showCreatePrayer, setShowCreatePrayer] = useState(false);
    const [newPrayerTitle, setNewPrayerTitle] = useState('');
    const [newPrayerContent, setNewPrayerContent] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // 1. Fetch Parishes
        const { data: parishesData } = await supabase.from('parishes').select('*').order('name');
        if (parishesData) {
            // Count members (approx) - actually counting via cell_members requires join
            setParishes(parishesData);
        }

        // 2. Fetch Members
        const { data: membersData } = await supabase.from('profiles').select('*').order('name');
        if (membersData) setMembers(membersData);

        // 3. Fetch Prayers
        const { data: prayersData } = await supabase.from('urgent_prayers').select('*').order('created_at', { ascending: false });
        if (prayersData) setPrayers(prayersData);

        setLoading(false);
    };

    const fetchCellsObj = async (parishId: string) => {
        const { data } = await supabase.from('cells').select('*').eq('parish_id', parishId).order('name');
        if (data) setCells(data);
    };

    useEffect(() => {
        if (selectedParishId) {
            fetchCellsObj(selectedParishId);
        }
    }, [selectedParishId]);


    // --- Actions ---

    // Create Parish
    const handleCreateParish = async () => {
        if (!newParishName.trim() || !newParishCode.trim()) return;
        const { error } = await supabase.from('parishes').insert({
            name: newParishName,
            invite_code: newParishCode
        });
        if (!error) {
            setNewParishName('');
            setNewParishCode('');
            setShowCreateParish(false);
            fetchData();
        } else {
            alert('교구 생성 실패: ' + error.message);
        }
    };

    // Create Cell
    const handleCreateCell = async () => {
        if (!newCellName.trim() || !newCellCode.trim() || !selectedParishId) return;
        const { error } = await supabase.from('cells').insert({
            parish_id: selectedParishId,
            name: newCellName,
            code: newCellCode
        });
        if (!error) {
            setNewCellName('');
            setNewCellCode('');
            setShowCreateCell(false);
            fetchCellsObj(selectedParishId);
        } else {
            alert('셀 생성 실패: ' + error.message);
        }
    };

    // Delete Parish
    const handleDeleteParish = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까? 모든 하위 셀과 데이터가 삭제됩니다.')) return;
        const { error } = await supabase.from('parishes').delete().eq('id', id);
        if (!error) fetchData();
        else alert('삭제 실패: ' + error.message);
    };

    // Delete Cell
    const handleDeleteCell = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await supabase.from('cells').delete().eq('id', id);
        if (!error && selectedParishId) fetchCellsObj(selectedParishId);
        else alert('삭제 실패: ' + error.message);
    };


    // ... (Member & Prayer functions same as before)
    const [isSendingPrayer, setIsSendingPrayer] = useState(false);

    const handleCreatePrayer = async () => {
        if (!newPrayerTitle.trim() || !newPrayerContent.trim()) return;

        setIsSendingPrayer(true);

        try {
            // Call API to save prayer AND send push notifications
            const response = await fetch('/api/send-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newPrayerTitle,
                    content: newPrayerContent,
                    requesterName: profile?.name || 'Admin',
                    userId: user?.id,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setNewPrayerTitle('');
                setNewPrayerContent('');
                setShowCreatePrayer(false);

                // Show success toast
                alert(`✅ ${result.message}`);

                // Refresh prayers list
                const { data } = await supabase.from('urgent_prayers').select('*').order('created_at', { ascending: false });
                if (data) setPrayers(data);
            } else {
                alert('❌ 전송 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('Error sending prayer:', error);
            alert('❌ 네트워크 오류가 발생했습니다.');
        } finally {
            setIsSendingPrayer(false);
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


    if (!isAdmin) return <div className="p-10 text-center">접근 권한이 없습니다.</div>;
    if (loading) return <div className="p-10 text-center">로딩 중...</div>;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
            <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                <div className="flex items-center justify-between px-5 py-4">
                    <button onClick={() => navigate(Screen.DASHBOARD)} className="p-2 -ml-2 rounded-full hover:bg-black/5">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold">관리자 (SOTA v2.0)</h1>
                    <div className="w-10"></div>
                </div>
                {/* Tabs */}
                <div className="flex border-t border-black/5 dark:border-white/10">
                    {[{ key: 'parishes', label: '교구/셀 관리', icon: 'church' }, { key: 'members', label: '멤버', icon: 'person' }, { key: 'prayers', label: '기도', icon: 'favorite' }].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-1 ${activeTab === tab.key ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>
                            <span className="material-symbols-outlined">{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <main className="p-5">
                {/* Parish Tab */}
                {activeTab === 'parishes' && (
                    <div className="space-y-6">
                        {/* Parish List */}
                        {!selectedParishId ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-lg font-bold">교구 목록</h2>
                                    <button onClick={() => setShowCreateParish(true)} className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">add</span> 추가
                                    </button>
                                </div>
                                {parishes.map((parish) => (
                                    <div key={parish.id} onClick={() => setSelectedParishId(parish.id)} className="p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm hover:ring-2 ring-primary cursor-pointer transition-all">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold text-lg">{parish.name}</h3>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteParish(parish.id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Selected Parish View (Manage Cells)
                            <div className="space-y-4">
                                <button onClick={() => setSelectedParishId(null)} className="text-sm text-slate-500 flex items-center mb-2">
                                    <span className="material-symbols-outlined text-sm">arrow_back</span> 교구 목록으로
                                </button>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-primary">{parishes.find(p => p.id === selectedParishId)?.name} 셀 목록</h2>
                                    <button onClick={() => setShowCreateCell(true)} className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold">
                                        + 셀 추가
                                    </button>
                                </div>
                                {cells.length === 0 ? (
                                    <p className="text-slate-500 text-center py-10">등록된 셀이 없습니다.</p>
                                ) : (
                                    cells.map(cell => (
                                        <div key={cell.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold">{cell.name}</h4>
                                                <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md inline-block mt-1">
                                                    코드: {cell.code}
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteCell(cell.id)} className="text-red-500 p-2">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div key={member.id} className="p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                        {member.name.slice(0, 1)}
                                    </div>
                                    <div>
                                        <div className="font-bold">{member.name}</div>
                                        <div className="text-xs text-slate-500">{member.email}</div>
                                    </div>
                                </div>
                                <select value={member.role} onChange={(e) => handleUpdateRole(member.id, e.target.value)} className="text-xs p-1 rounded border dark:bg-slate-800">
                                    <option value="MEMBER">멤버</option>
                                    <option value="LEADER">리더</option>
                                    <option value="PASTOR">목사</option>
                                </select>
                            </div>
                        ))}
                    </div>
                )}

                {/* Prayers Tab */}
                {activeTab === 'prayers' && (
                    <div className="space-y-4">
                        <button onClick={() => setShowCreatePrayer(true)} className="w-full py-3 bg-red-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">campaign</span> 긴급 기도 발송
                        </button>
                        {prayers.map(p => (
                            <div key={p.id} className={`p-4 rounded-xl border ${p.is_active ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 opacity-60'}`}>
                                <h4 className="font-bold">{p.title}</h4>
                                <p className="text-sm mt-1">{p.content}</p>
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
                                    <button onClick={() => handleTogglePrayer(p.id, p.is_active)} className="text-xs px-3 py-1 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                                        {p.is_active ? '종료하기' : '다시 활성화'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            {showCreateParish && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">새 교구 추가</h3>
                        <input value={newParishName} onChange={e => setNewParishName(e.target.value)} placeholder="교구 이름 (예: 믿음교구)" className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2" />
                        <input value={newParishCode} onChange={e => setNewParishCode(e.target.value)} placeholder="초대 코드 (예: FAITH)" className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreateParish(false)} className="flex-1 py-3 bg-slate-200 rounded-xl">취소</button>
                            <button onClick={handleCreateParish} className="flex-1 py-3 bg-primary text-white rounded-xl">생성</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateCell && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">새 셀 추가</h3>
                        <input value={newCellName} onChange={e => setNewCellName(e.target.value)} placeholder="셀 이름 (예: 여호수아 1셀)" className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2" />
                        <input value={newCellCode} onChange={e => setNewCellCode(e.target.value)} placeholder="입장 코드 (예: JOSHUA1)" className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreateCell(false)} className="flex-1 py-3 bg-slate-200 rounded-xl">취소</button>
                            <button onClick={handleCreateCell} className="flex-1 py-3 bg-primary text-white rounded-xl">생성</button>
                        </div>
                    </div>
                </div>
            )}

            {showCreatePrayer && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-sm">
                        <h3 className="font-bold text-lg mb-4">긴급 기도 요청</h3>
                        <input value={newPrayerTitle} onChange={e => setNewPrayerTitle(e.target.value)} placeholder="제목" className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2" />
                        <textarea value={newPrayerContent} onChange={e => setNewPrayerContent(e.target.value)} placeholder="내용" className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 h-32" />
                        <div className="flex gap-2">
                            <button onClick={() => setShowCreatePrayer(false)} disabled={isSendingPrayer} className="flex-1 py-3 bg-slate-200 rounded-xl disabled:opacity-50">취소</button>
                            <button onClick={handleCreatePrayer} disabled={isSendingPrayer} className="flex-1 py-3 bg-red-500 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                                {isSendingPrayer ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        전송 중...
                                    </>
                                ) : (
                                    <>📢 전송</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
export default AdminScreen;
