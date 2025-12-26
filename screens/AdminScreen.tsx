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

interface PrayerParticipant {
    user_id: string;
    name: string;
    prayed_at: string;
}

// Helper function to format relative time
const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
};

const AdminScreen: React.FC<AdminScreenProps> = ({ navigate, t }) => {
    const { user, profile, isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<'parishes' | 'members' | 'prayers' | 'stats' | 'info'>('parishes');
    const [stats, setStats] = useState({ totalMembers: 0, activeToday: 0, cellStats: [] as any[] });
    const [parishes, setParishes] = useState<any[]>([]);
    const [selectedParishId, setSelectedParishId] = useState<string | null>(null);
    const [cells, setCells] = useState<any[]>([]); // Cells within selected Parish
    const [members, setMembers] = useState<any[]>([]);
    const [prayers, setPrayers] = useState<UrgentPrayer[]>([]);
    const [prayerParticipants, setPrayerParticipants] = useState<Record<string, PrayerParticipant[]>>({});
    const [expandedPrayerId, setExpandedPrayerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // LEADER/SUB_ADMIN context info
    const [myCell, setMyCell] = useState<{ id: string; name: string; parish_name: string } | null>(null);
    const [myParish, setMyParish] = useState<{ id: string; name: string } | null>(null);

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
    const [pushTarget, setPushTarget] = useState<'ALL' | 'PARISH' | 'CELL'>('ALL');

    // Optimized Data Fetching
    useEffect(() => {
        if (!loading && !profile) return; // Wait for auth
        fetchData();
    }, [profile?.id, profile?.role]); // Re-fetch only when profile changes

    const fetchData = async () => {
        if (!profile) return;
        setLoading(true);

        try {
            // 1. Context Data (Admin/Leader Info) - Run in parallel
            const contextPromise = (async () => {
                if (isLeader && profile.cell_id) {
                    const { data } = await supabase.from('cells').select('id, name, parishes(name)').eq('id', profile.cell_id).single();
                    if (data) setMyCell({ id: data.id, name: data.name, parish_name: (data.parishes as any)?.name || '' });
                }
                if (isSubAdmin && profile.parish_id) {
                    const { data } = await supabase.from('parishes').select('id, name').eq('id', profile.parish_id).single();
                    if (data) setMyParish({ id: data.id, name: data.name });
                }
                if (canManageParishCell) {
                    const { data } = await supabase.from('parishes').select('*').order('name');
                    if (data) setParishes(data);
                }
            })();

            // 2. Content Data (Members, Prayers) - Run in parallel
            const contentPromise = (async () => {
                // Fetch Members based on Role
                // Optimize: Fetch parish/cell names via FKs
                const memberSelect = '*, parishes(name), cells(name)';
                let membersQuery = supabase.from('profiles').select(memberSelect).order('name');

                if (isSubAdmin && profile.parish_id) {
                    // SUB_ADMIN: Get members in own parish
                    const { data } = await supabase
                        .from('profiles')
                        .select(memberSelect)
                        .eq('parish_id', profile.parish_id)
                        .order('name');

                    if (data) setMembers(data);

                } else if (isLeader && profile.cell_id) {
                    // LEADER: Get members in own cell
                    const { data } = await supabase
                        .from('profiles')
                        .select(memberSelect)
                        .eq('cell_id', profile.cell_id)
                        .order('name');

                    if (data) setMembers(data);

                } else if (isPastor) {
                    // PASTOR: Get all members with context
                    const { data } = await membersQuery;
                    if (data) setMembers(data);
                }

                // Fetch Prayers
                const { data: prayersData } = await supabase
                    .from('urgent_prayers')
                    .select('*, profiles:created_by(role)')
                    .order('created_at', { ascending: false });

                if (prayersData) {
                    const enrichedPrayers = prayersData.map((p: any) => ({
                        ...p,
                        creator_role: (p.profiles as any)?.role || 'MEMBER'
                    }));
                    setPrayers(enrichedPrayers);

                    // Fetch Participants
                    const prayerIds = prayersData.map((p: any) => p.id);
                    if (prayerIds.length > 0) {
                        const { data: participants } = await supabase
                            .from('prayer_participants')
                            .select('prayer_id, user_id, prayed_at, profiles(name)')
                            .in('prayer_id', prayerIds);

                        if (participants) {
                            const grouped = participants.reduce((acc: any, p: any) => {
                                if (!acc[p.prayer_id]) acc[p.prayer_id] = [];
                                acc[p.prayer_id].push({
                                    user_id: p.user_id,
                                    user_name: p.profiles?.name || '알 수 없음',
                                    prayed_at: p.prayed_at
                                });
                                return acc;
                            }, {});
                            setPrayerParticipants(grouped);
                        }
                    }
                }
            })();

            // Wait for all critical data
            await Promise.all([contextPromise, contentPromise]);

        } catch (e) {
            console.error('Data fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    // --- Permission Helpers ---
    const isPastor = profile?.role === 'PASTOR';
    const isSubAdmin = profile?.role === 'SUB_ADMIN';
    const isLeader = profile?.role === 'LEADER';

    // Can add/delete parishes and cells
    const canManageParishCell = isPastor || isSubAdmin;

    // Can modify prayer (delete/toggle)
    const canModifyPrayer = (prayer: UrgentPrayer & { created_by?: string; creator_role?: string }) => {
        // PASTOR can do anything
        if (isPastor) return true;
        // Creator can always modify their own
        if (prayer.created_by === user?.id) return true;
        // SUB_ADMIN can modify LEADER's prayers
        if (isSubAdmin && prayer.creator_role === 'LEADER') return true;
        return false;
    };

    // Can change member role
    const canChangeRole = (memberRole: string) => {
        if (isPastor) return true;
        if (isSubAdmin && (memberRole === 'MEMBER' || memberRole === 'LEADER')) return true;
        return false;
    };

    // Get available roles for role selector
    const getAvailableRoles = () => {
        if (isPastor) return ['MEMBER', 'LEADER', 'SUB_ADMIN', 'PASTOR'];
        if (isSubAdmin) return ['MEMBER', 'LEADER'];
        return [];
    };

    // Dynamic page title based on role
    const getPageTitle = () => {
        if (isLeader) return '셀 관리';
        if (isSubAdmin) return '교구 관리';
        return '관리자 페이지';
    };

    // Get tabs based on role
    const getTabs = () => {
        if (isLeader) {
            return [
                { key: 'info', label: '셀 정보', icon: 'info' },
                { key: 'members', label: '셀원', icon: 'person' },
                { key: 'prayers', label: '기도', icon: 'favorite' },
                { key: 'stats', label: '진도율', icon: 'bar_chart' }
            ];
        }
        if (isSubAdmin) {
            return [
                { key: 'info', label: '교구 정보', icon: 'info' },
                { key: 'parishes', label: '셀 관리', icon: 'groups' },
                { key: 'members', label: '교구원', icon: 'person' },
                { key: 'prayers', label: '기도', icon: 'favorite' },
                { key: 'stats', label: '통계', icon: 'bar_chart' }
            ];
        }
        // PASTOR: full access
        return [
            { key: 'parishes', label: '교구/셀 관리', icon: 'church' },
            { key: 'members', label: '멤버', icon: 'person' },
            { key: 'prayers', label: '기도', icon: 'favorite' },
            { key: 'stats', label: '통계', icon: 'bar_chart' }
        ];
    };

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

    const fetchData_Legacy = async () => {
        setLoading(true);

        // 1. Fetch Parishes (only PASTOR/SUB_ADMIN need to see these)
        if (canManageParishCell) {
            const { data: parishesData } = await supabase.from('parishes').select('*').order('name');
            if (parishesData) setParishes(parishesData);
        }

        // 2. Fetch Members - Role-based filtering
        let membersData: any[] = [];

        if (isPastor) {
            // PASTOR: see all members
            const { data } = await supabase.from('profiles').select('*').order('name');
            membersData = data || [];
        } else if (isSubAdmin && profile?.parish_id) {
            // SUB_ADMIN: see members in their parish's cells
            const { data: parishCells } = await supabase
                .from('cells')
                .select('id')
                .eq('parish_id', profile.parish_id);

            if (parishCells && parishCells.length > 0) {
                const cellIds = parishCells.map((c: { id: string }) => c.id);
                const { data: cellMembers } = await supabase
                    .from('cell_members')
                    .select('user_id, profiles(*)')
                    .in('cell_id', cellIds);

                if (cellMembers) {
                    membersData = cellMembers.map((cm: any) => cm.profiles).filter(Boolean);
                }
            }
        } else if (isLeader && profile?.cell_id) {
            // LEADER: see only their cell members
            const { data: cellMembers } = await supabase
                .from('cell_members')
                .select('user_id, profiles(*)')
                .eq('cell_id', profile.cell_id);

            if (cellMembers) {
                membersData = cellMembers.map((cm: any) => cm.profiles).filter(Boolean);
            }
        }

        // Remove duplicates (in case same profile appears multiple times)
        const uniqueMembers = Array.from(
            new Map(membersData.map(m => [m.id, m])).values()
        );
        setMembers(uniqueMembers);

        // 3. Fetch Prayers with creator info
        const { data: prayersData } = await supabase
            .from('urgent_prayers')
            .select('*, profiles:created_by(role)')
            .order('created_at', { ascending: false });

        if (prayersData) {
            const enrichedPrayers = prayersData.map((p: any) => ({
                ...p,
                creator_role: (p.profiles as any)?.role || 'MEMBER'
            }));
            setPrayers(enrichedPrayers);

            // 4. Fetch Prayer Participants
            const prayerIds = prayersData.map((p: UrgentPrayer) => p.id);
            if (prayerIds.length > 0) {
                const { data: participantsData } = await supabase
                    .from('prayer_participants')
                    .select('prayer_id, user_id, prayed_at, profiles(name)')
                    .in('prayer_id', prayerIds)
                    .order('prayed_at', { ascending: false });

                if (participantsData) {
                    const grouped: Record<string, PrayerParticipant[]> = {};
                    participantsData.forEach((p: any) => {
                        if (!grouped[p.prayer_id]) grouped[p.prayer_id] = [];
                        grouped[p.prayer_id].push({
                            user_id: p.user_id,
                            name: p.profiles?.name || '익명',
                            prayed_at: p.prayed_at
                        });
                    });
                    setPrayerParticipants(grouped);
                }
            }
        }

        // 5. Fetch LEADER's own cell info
        if (isLeader && profile?.cell_id) {
            const { data: cellData } = await supabase
                .from('cells')
                .select('id, name, parishes(name)')
                .eq('id', profile.cell_id)
                .single();

            if (cellData) {
                setMyCell({
                    id: cellData.id,
                    name: cellData.name,
                    parish_name: (cellData.parishes as any)?.name || ''
                });
            }
        }

        // 6. Fetch SUB_ADMIN's own parish info
        if (isSubAdmin && profile?.parish_id) {
            const { data: parishData } = await supabase
                .from('parishes')
                .select('id, name')
                .eq('id', profile.parish_id)
                .single();

            if (parishData) {
                setMyParish({
                    id: parishData.id,
                    name: parishData.name
                });
            }
        }

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
                    targetRole: pushTarget,
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
        const previousRole = members.find(m => m.id === memberId)?.role;

        // Optimistic update
        setMembers(members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));

        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);

        if (error) {
            // Revert on error
            setMembers(members.map((m) => (m.id === memberId ? { ...m, role: previousRole } : m)));
            alert(`❌ 역할 변경 실패: ${error.message}`);
        } else {
            // Show success feedback
            const roleNames: Record<string, string> = {
                'MEMBER': '셀원',
                'LEADER': '셀장',
                'SUB_ADMIN': '부관리자',
                'PASTOR': '관리자'
            };
            alert(`✅ ${roleNames[newRole]}(으)로 변경되었습니다.`);
        }
    };

    const handleDeleteMember = async (memberId: string, memberName: string) => {
        if (!confirm(`정말 "${memberName}" 회원을 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) return;

        // Manual Cascade Delete
        try {
            // 1. Delete dependent data
            await supabase.from('reading_activities').delete().eq('user_id', memberId);
            await supabase.from('user_reading_progress').delete().eq('user_id', memberId);
            await supabase.from('daily_readings').delete().eq('user_id', memberId);
            await supabase.from('bible_highlights').delete().eq('user_id', memberId);
            await supabase.from('cell_members').delete().eq('user_id', memberId);
            await supabase.from('cell_activities').delete().eq('user_id', memberId);
            await supabase.from('push_subscriptions').delete().eq('user_id', memberId);
            await supabase.from('prayer_participants').delete().eq('user_id', memberId);

            // 2. Delete notifications
            await supabase.from('notifications').delete().eq('user_id', memberId);
            await supabase.from('notifications').delete().eq('sender_id', memberId);

            // 3. Delete Urgent Prayers created by user
            await supabase.from('urgent_prayers').delete().eq('created_by', memberId);

            // 4. Finally delete profile
            const { error } = await supabase.from('profiles').delete().eq('id', memberId);

            if (error) throw error;

            setMembers(prev => prev.filter(m => m.id !== memberId));
            alert(`✅ "${memberName}" 회원이 삭제되었습니다.`);
        } catch (error: any) {
            alert(`❌ 삭제 실패: ${error.message || error}`);
        }
    };

    const handleDeletePrayer = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        // 1. Delete related notifications
        await supabase.from('notifications').delete().contains('data', { prayer_id: id });

        // 2. Delete participants
        await supabase.from('prayer_participants').delete().eq('prayer_id', id);

        // 3. Delete prayer
        const { error } = await supabase.from('urgent_prayers').delete().eq('id', id);

        if (!error) {
            setPrayers(prev => prev.filter(p => p.id !== id));
        } else {
            alert('삭제 실패: ' + error.message);
        }
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
                    <div className="text-center">
                        <h1 className="text-xl font-bold">{getPageTitle()}</h1>
                        {isLeader && myCell && (
                            <p className="text-xs text-slate-500">{myCell.parish_name} › {myCell.name}</p>
                        )}
                        {isSubAdmin && myParish && (
                            <p className="text-xs text-slate-500">{myParish.name}</p>
                        )}
                    </div>
                    <div className="w-10"></div>
                </div>
                {/* Tabs - Horizontally Scrollable */}
                <div className="overflow-x-auto no-scrollbar border-t border-black/5 dark:border-white/10">
                    <div className="flex min-w-max">
                        {getTabs().map((tab) => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex-shrink-0 px-5 py-3 text-sm font-medium flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === tab.key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="p-5">
                {/* LEADER: Cell Info Tab */}
                {activeTab === 'info' && isLeader && (
                    <div className="space-y-6">
                        {myCell ? (
                            <>
                                {/* Cell Hierarchy Card */}
                                <div className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-2xl p-6 border border-primary/10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-primary">groups</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">담당 셀</p>
                                            <h2 className="text-2xl font-bold text-primary">{myCell.name}</h2>
                                        </div>
                                    </div>

                                    {/* Hierarchy Breadcrumb */}
                                    <div className="flex items-center gap-2 mt-4 text-sm">
                                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">church</span>
                                            {myCell.parish_name}
                                        </span>
                                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">groups</span>
                                            {myCell.name}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">셀원 수</p>
                                        <h3 className="text-3xl font-bold text-primary">{members.length}명</h3>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">내 역할</p>
                                        <h3 className="text-xl font-bold text-blue-600">셀 리더</h3>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                                    <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-lg">tips_and_updates</span>
                                        셀장 가이드
                                    </h4>
                                    <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                                        <li>• <b>셀원</b> 탭에서 셀원 목록을 확인하세요</li>
                                        <li>• <b>기도</b> 탭에서 셀원들에게 긴급 기도를 요청하세요</li>
                                        <li>• <b>진도율</b> 탭에서 셀원별 말씀 진도를 확인하세요</li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-500">셀 정보를 불러오는 중...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* SUB_ADMIN: Parish Info Tab */}
                {activeTab === 'info' && isSubAdmin && (
                    <div className="space-y-6">
                        {myParish ? (
                            <>
                                {/* Parish Card */}
                                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/5 dark:from-indigo-500/20 dark:to-purple-500/10 rounded-2xl p-6 border border-indigo-500/10">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-3xl text-indigo-600">church</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium">담당 교구</p>
                                            <h2 className="text-2xl font-bold text-indigo-600">{myParish.name}</h2>
                                        </div>
                                    </div>

                                    {/* Role badge */}
                                    <div className="flex items-center gap-2 mt-4">
                                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium flex items-center gap-1 text-sm">
                                            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                                            교구장 (부관리자)
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">셀 수</p>
                                        <h3 className="text-3xl font-bold text-indigo-600">{cells.length}개</h3>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">교구원 수</p>
                                        <h3 className="text-3xl font-bold text-primary">{members.length}명</h3>
                                    </div>
                                </div>

                                {/* Guide */}
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                                    <h4 className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-lg">tips_and_updates</span>
                                        교구장 가이드
                                    </h4>
                                    <ul className="text-sm text-indigo-600 dark:text-indigo-400 space-y-1">
                                        <li>• <b>셀 관리</b> 탭에서 교구 내 셀들을 관리하세요</li>
                                        <li>• <b>교구원</b> 탭에서 교구원 목록을 확인하세요</li>
                                        <li>• <b>기도</b> 탭에서 교구원들에게 긴급 기도를 요청하세요</li>
                                        <li>• <b>통계</b> 탭에서 셀별 참여율을 확인하세요</li>
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-slate-500">교구 정보를 불러오는 중...</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Parish Tab */}
                {activeTab === 'parishes' && (
                    <div className="space-y-6">
                        {/* Parish List */}
                        {!selectedParishId ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h2 className="text-lg font-bold">교구 목록</h2>
                                    {canManageParishCell && (
                                        <button onClick={() => setShowCreateParish(true)} className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold flex items-center gap-1 shadow-md hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-sm">add</span> 추가
                                        </button>
                                    )}
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
                                                {canManageParishCell && (
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteParish(parish.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                )}
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
                                    {canManageParishCell && (
                                        <button onClick={() => setShowCreateCell(true)} className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold">
                                            + 셀 추가
                                        </button>
                                    )}
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
                                            {canManageParishCell && (
                                                <button onClick={() => handleDeleteCell(cell.id)} className="text-red-500 p-2">
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            )}
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
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                {member.name}
                                                {/* Show Parish/Cell info if available */}
                                                {(member.parishes || member.cells) && (
                                                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                                                        {(member.parishes as any)?.name} {(member.parishes && member.cells) && '·'} {(member.cells as any)?.name}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate max-w-[150px]">{member.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`px-2 py-1 rounded-lg text-xs font-bold ${member.role === 'PASTOR' ? 'bg-purple-100 text-purple-600' :
                                            member.role === 'SUB_ADMIN' ? 'bg-indigo-100 text-indigo-600' :
                                                member.role === 'LEADER' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-slate-100 text-slate-500'
                                            }`}>
                                            {member.role === 'MEMBER' ? '셀원' :
                                                member.role === 'LEADER' ? '셀장' :
                                                    member.role === 'SUB_ADMIN' ? '부관리자' : '관리자'}
                                        </div>
                                        <select
                                            value={member.role}
                                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                            disabled={profile?.role === 'SUB_ADMIN' && (member.role === 'PASTOR' || member.role === 'SUB_ADMIN')}
                                            className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-700 border-none cursor-pointer disabled:opacity-50"
                                        >
                                            <option value="MEMBER">셀원</option>
                                            <option value="LEADER">셀장</option>
                                            {profile?.role === 'PASTOR' && <option value="SUB_ADMIN">부관리자</option>}
                                            {profile?.role === 'PASTOR' && <option value="PASTOR">관리자</option>}
                                        </select>
                                        {/* Delete button - only show if:
                                            1. Not self-delete
                                            2. PASTOR can delete anyone
                                            3. SUB_ADMIN can only delete MEMBER/LEADER */}
                                        {member.id !== user?.id &&
                                            (profile?.role === 'PASTOR' ||
                                                (profile?.role === 'SUB_ADMIN' && (member.role === 'MEMBER' || member.role === 'LEADER'))) && (
                                                <button
                                                    onClick={() => handleDeleteMember(member.id, member.name)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                    title="회원 삭제"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            )}
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
                        {prayers.map(p => {
                            const participants = prayerParticipants[p.id] || [];
                            const isExpanded = expandedPrayerId === p.id;
                            return (
                                <div key={p.id} className={`p-4 rounded-xl border ${p.is_active ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 opacity-60'}`}>
                                    <h4 className="font-bold">{p.title}</h4>
                                    <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">{p.content}</p>

                                    {/* Participant Count & Toggle */}
                                    <button
                                        onClick={() => setExpandedPrayerId(isExpanded ? null : p.id)}
                                        className="mt-3 flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        <span>🙏</span>
                                        <span className="font-semibold">{participants.length}명 함께 기도함</span>
                                        <span className="material-symbols-outlined text-base">
                                            {isExpanded ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>

                                    {/* Expandable Participant List */}
                                    {isExpanded && participants.length > 0 && (
                                        <div className="mt-2 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                                            <h5 className="text-xs font-bold text-slate-500 mb-2">참여자 목록</h5>
                                            <div className="space-y-2">
                                                {participants.map((participant, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                                            {participant.name}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {formatRelativeTime(participant.prayed_at)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {isExpanded && participants.length === 0 && (
                                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-400 text-center">
                                            아직 참여자가 없습니다
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                        <span className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
                                        <div className="flex gap-2">
                                            {canModifyPrayer(p) && (
                                                <>
                                                    <button onClick={() => handleDeletePrayer(p.id)} className="text-xs px-3 py-1 bg-white dark:bg-slate-700 text-red-500 rounded-full shadow-sm hover:bg-red-50">
                                                        삭제
                                                    </button>
                                                    <button onClick={() => handleTogglePrayer(p.id, p.is_active)} className="text-xs px-3 py-1 bg-white dark:bg-slate-700 rounded-full shadow-sm">
                                                        {p.is_active ? '종료하기' : '다시 활성화'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Stats Tab */}
                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        {/* LEADER: Cell Member Progress */}
                        {isLeader ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">셀원 수</p>
                                        <h3 className="text-3xl font-bold text-primary">{members.length}명</h3>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                        <p className="text-green-500 text-xs font-bold uppercase mb-1">오늘 읽음</p>
                                        <h3 className="text-3xl font-bold text-green-600">{stats.activeToday}명</h3>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold mb-4 px-2">셀원별 진도율</h3>
                                    <div className="space-y-3">
                                        {members.map((member: any) => {
                                            // Calculate member's reading progress (simulated - would need real data)
                                            const totalChapters = 1189; // Total Bible chapters
                                            const readChapters = Math.floor(Math.random() * 100); // TODO: Get real data
                                            const progress = Math.round((readChapters / totalChapters) * 100);

                                            return (
                                                <div key={member.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 font-bold">
                                                                {member.name?.slice(0, 1) || '?'}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-white">{member.name}</h4>
                                                                <p className="text-xs text-slate-500">{readChapters}장 읽음</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-xl font-bold text-slate-900 dark:text-white">{progress}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {members.length === 0 && (
                                            <div className="text-center text-slate-400 py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200">
                                                셀원이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            /* PASTOR/SUB_ADMIN: Cell-level Stats */
                            <>
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
                            </>
                        )}
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

                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-1">발송 대상</label>
                            <select
                                value={pushTarget}
                                onChange={(e) => setPushTarget(e.target.value as any)}
                                className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"
                            >
                                {isLeader ? (
                                    <option value="CELL">내 셀원들에게</option>
                                ) : (
                                    <>
                                        <option value="ALL">전체 (모든 교구/셀)</option>
                                        <option value="PARISH">내 교구</option>
                                    </>
                                )}
                            </select>
                            <p className="text-xs text-slate-500 mt-1">
                                {pushTarget === 'ALL' && '앱을 설치한 모든 리더/멤버에게 전송됩니다.'}
                                {pushTarget === 'PARISH' && '내 교구 셀원들에게 전송됩니다.'}
                                {pushTarget === 'CELL' && '내 셀원들에게만 전송됩니다.'}
                            </p>
                        </div>

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
