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
    const [activeTab, setActiveTab] = useState<'parishes' | 'members' | 'prayers' | 'stats'>('parishes');
    const [stats, setStats] = useState({ totalMembers: 0, activeToday: 0, cellStats: [] as any[] });
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

    useEffect(() => {
        if (activeTab === 'stats') fetchStats();
    }, [activeTab]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            const today = new Date().toISOString().split('T')[0];
            const { count: todayCount } = await supabase.from('daily_readings').select('*', { count: 'exact', head: true }).eq('reading_date', today);

            // Fetch Cells and Members to calculate per-cell stats
            const { data: allCells } = await supabase.from('cells').select('id, name, parish_id');
            const { data: cellMembers } = await supabase.from('cell_members').select('cell_id, user_id');
            const { data: todayReadings } = await supabase.from('daily_readings').select('user_id').eq('reading_date', today);

            if (allCells && cellMembers) {
                const statsData = allCells.map((cell: any) => {
                    const membersInCell = cellMembers.filter((m: any) => m.cell_id === cell.id);
                    const readersInCell = membersInCell.filter((m: any) => todayReadings?.some((r: any) => r.user_id === m.user_id));
                    return {
                        id: cell.id,
                        name: cell.name,
                        memberCount: membersInCell.length,
                        readerCount: readersInCell.length,
                        rate: membersInCell.length > 0 ? Math.round((readersInCell.length / membersInCell.length) * 100) : 0
                    };
                }).sort((a: any, b: any) => b.rate - a.rate);

                setStats({
                    totalMembers: memberCount || 0,
                    activeToday: todayCount || 0,
                    cellStats: statsData
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-xl font-bold">관리자 페이지</h1>
                    <div className="w-10"></div>
                </div>
                {/* Tabs - Horizontally Scrollable */}
                <div className="overflow-x-auto no-scrollbar border-t border-black/5 dark:border-white/10">
                    <div className="flex min-w-max">
                        {[{ key: 'parishes', label: '교구/셀 관리', icon: 'church' }, { key: 'members', label: '멤버', icon: 'person' }, { key: 'prayers', label: '기도', icon: 'favorite' }, { key: 'stats', label: '통계', icon: 'bar_chart' }].map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex-shrink-0 px-5 py-3 text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === tab.key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="p-5">
                {/* Parish Tab */}
                {activeTab === 'parishes' && (
                    <div className="space-y-6">
                        {/* Parish List */}
                        {!selectedParishId ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h2 className="text-lg font-bold">교구 목록</h2>
                                    <button onClick={() => setShowCreateParish(true)} className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-1 shadow-md hover:scale-105 transition-transform">
                                        <span className="material-symbols-outlined text-sm">add</span> 추가
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {parishes.map((parish) => (
                                        <div
                                            key={parish.id}
                                            onClick={() => setSelectedParishId(parish.id)}
                                            className="p-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <span className="material-symbols-outlined text-2xl">church</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{parish.name}</h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">초대 코드: <span className="font-mono font-bold">{parish.invite_code}</span></p>
                                                    </div>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteParish(parish.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {parishes.length === 0 && (
                                        <div className="text-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                            교구를 추가해주세요
                                        </div>
                                    )}
                                </div>
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
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h2 className="text-lg font-bold">멤버 목록 ({members.length}명)</h2>
                        </div>
                        <div className="space-y-3">
                            {members.map((member) => (
                                <div key={member.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                                            {member.name.slice(0, 1)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white">{member.name}</div>
                                            <div className="text-xs text-slate-400 truncate max-w-[150px]">{member.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${member.role === 'PASTOR' ? 'bg-purple-100 text-purple-600' : member.role === 'LEADER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {member.role === 'MEMBER' ? '멤버' : member.role === 'LEADER' ? '리더' : '목사'}
                                        </div>
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                            className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-700 border-none cursor-pointer"
                                        >
                                            <option value="MEMBER">멤버</option>
                                            <option value="LEADER">리더</option>
                                            <option value="PASTOR">목사</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
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

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-500 text-sm font-bold uppercase mb-2">총 멤버</p>
                                <h3 className="text-4xl font-bold text-slate-900 dark:text-white">{stats.totalMembers}</h3>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                <p className="text-green-500 text-sm font-bold uppercase mb-2">오늘 읽음</p>
                                <h3 className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.activeToday}</h3>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4 px-2">셀별 참여율 현황</h3>
                            <div className="space-y-3">
                                {stats.cellStats.map((cell: any) => (
                                    <div key={cell.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <h4 className="font-bold text-lg text-slate-900 dark:text-white">{cell.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    멤버 {cell.memberCount}명 중 <span className="text-green-600 font-bold">{cell.readerCount}명</span> 읽음
                                                </p>
                                            </div>
                                            <span className="text-2xl font-bold text-slate-900 dark:text-white">{cell.rate}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${cell.rate}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                                {stats.cellStats.length === 0 && (
                                    <div className="text-center text-slate-400 py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200">
                                        데이터가 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
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
