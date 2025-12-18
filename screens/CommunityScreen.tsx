'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface CommunityScreenProps {
    navigate: (screen: Screen) => void;
    t: Translations;
}

interface CellMember {
    user_id: string;
    joined_at: string;
    profile: {
        name: string;
        email: string;
        role: string;
        avatar_url: string | null;
    };
}

interface CellInfo {
    id: string;
    name: string;
    invite_code: string;
}

interface Activity {
    id: string;
    user_name: string;
    type: string;
    title: string;
    created_at: string;
}

const CommunityScreen: React.FC<CommunityScreenProps> = ({ navigate, t }) => {
    const { user, profile } = useAuth();
    const [cellInfo, setCellInfo] = useState<CellInfo | null>(null);
    const [members, setMembers] = useState<CellMember[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'members' | 'activity'>('members');

    useEffect(() => {
        const fetchCellData = async () => {
            if (!user) return;

            // Get user's cell
            const { data: cellMembership } = await supabase
                .from('cell_members')
                .select('cell_id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (cellMembership) {
                // Get cell info
                const { data: cell } = await supabase
                    .from('cells')
                    .select('*')
                    .eq('id', cellMembership.cell_id)
                    .maybeSingle();

                if (cell) {
                    setCellInfo(cell);

                    // Get cell members with profiles
                    const { data: membersData } = await supabase
                        .from('cell_members')
                        .select(`
              user_id,
              joined_at,
              profile:profiles!cell_members_user_id_fkey (
                name,
                email,
                role,
                avatar_url
              )
            `)
                        .eq('cell_id', cell.id)
                        .order('joined_at', { ascending: true });

                    if (membersData) {
                        // Filter out members without profile data
                        const validMembers = membersData.filter((m: { profile: unknown }) => m.profile && !Array.isArray(m.profile));
                        setMembers(validMembers as unknown as CellMember[]);
                    }

                    // Get recent activities (Unified Feed)
                    const { data: activitiesData } = await supabase
                        .from('cell_activities')
                        .select(`
                            *,
                            profile:profiles!cell_activities_user_id_fkey (name)
                        `)
                        .eq('cell_id', cell.id)
                        .order('created_at', { ascending: false })
                        .limit(20);

                    if (activitiesData) {
                        // Map to Activity interface
                        const formattedActivities = activitiesData.map((a: any) => ({
                            id: a.id,
                            user_name: a.profile?.name || '알 수 없음',
                            type: a.type,
                            title: a.title,
                            created_at: a.created_at
                        }));
                        setActivities(formattedActivities);
                    }
                }
            }
            setLoading(false);
        };

        fetchCellData();
    }, [user]);

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'PASTOR': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'LEADER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'PASTOR': return '목사';
            case 'LEADER': return '리더';
            default: return '멤버';
        }
    };

    const getInitials = (name: string) => {
        return name.slice(0, 2).toUpperCase();
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        return `${days}일 전`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 dark:text-slate-400">셀 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!cellInfo) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
                <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-5 py-4">
                    <h1 className="text-xl font-bold">커뮤니티</h1>
                </header>
                <div className="flex flex-col items-center justify-center h-[60vh] px-6 text-center">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl text-slate-400">group_off</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">소속된 셀이 없습니다</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        프로필에서 셀에 가입하거나<br />관리자에게 문의해주세요
                    </p>
                    <button
                        onClick={() => navigate(Screen.SETTINGS)}
                        className="px-6 py-3 bg-primary text-white rounded-full font-medium"
                    >
                        프로필로 이동
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/10">
                <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider">내 셀</p>
                            <h1 className="text-xl font-bold">{cellInfo.name}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                <span className="text-sm font-medium">{members.length}명</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-t border-black/5 dark:border-white/10">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'members'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        멤버
                    </button>
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'activity'
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        활동
                    </button>
                </div>
            </header>

            <main className="p-5">
                {activeTab === 'members' ? (
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member.user_id}
                                className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {getInitials(member.profile.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold truncate">{member.profile.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.profile.role)}`}>
                                            {getRoleLabel(member.profile.role)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                        {member.profile.email}
                                    </p>
                                </div>
                                {member.user_id === user?.id && (
                                    <span className="text-xs text-primary font-medium">나</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-2xl text-slate-400">history</span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400">아직 활동 기록이 없습니다</p>
                                <p className="text-sm text-slate-400 mt-1">성경을 읽으면 여기에 표시됩니다</p>
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-start gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'PRAYER'
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                            : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                        }`}>
                                        <span className="material-symbols-outlined">
                                            {activity.type === 'PRAYER' ? 'volunteer_activism' : 'menu_book'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm">
                                            <span className="font-semibold">{activity.user_name}</span>님이{' '}
                                            <span className="text-text-main dark:text-white">{activity.title}</span>
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{formatTime(activity.created_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CommunityScreen;
