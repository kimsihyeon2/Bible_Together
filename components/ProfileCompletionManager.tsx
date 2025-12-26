'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export function ProfileCompletionManager() {
    const { user, profile, refreshProfile } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Selection State
    const [parishes, setParishes] = useState<any[]>([]);
    const [cells, setCells] = useState<any[]>([]);
    const [selectedParishId, setSelectedParishId] = useState<string>('');
    const [selectedCellId, setSelectedCellId] = useState<string>('');

    useEffect(() => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
        checkProfileCompleteness();
    }, [profile, user]);

    const checkProfileCompleteness = async () => {
        if (!user || !profile) return;

        // SKIP for PASTOR
        if (profile.role === 'PASTOR') return;

        // Check if parish_id or cell_id is missing
        if (!profile.parish_id || !profile.cell_id) {
            setShowModal(true);
            fetchParishes();
        } else {
            setShowModal(false);
        }
    };

    const fetchParishes = async () => {
        const { data } = await supabase.from('parishes').select('*').order('name');
        if (data) setParishes(data);
    };

    const fetchCells = async (parishId: string) => {
        const { data } = await supabase.from('cells').select('*').eq('parish_id', parishId).order('name');
        if (data) setCells(data);
        else setCells([]);
    };

    const handleParishChange = (parishId: string) => {
        setSelectedParishId(parishId);
        setSelectedCellId(''); // Reset cell
        if (parishId) {
            fetchCells(parishId);
        } else {
            setCells([]);
        }
    };

    const handleSave = async () => {
        if (!user || !profile || !selectedParishId || !selectedCellId) return;
        setLoading(true);

        try {
            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    parish_id: selectedParishId,
                    cell_id: selectedCellId
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 2. Add to cell_members (if not exists)
            // First check if already in a cell
            const { data: existingMember } = await supabase
                .from('cell_members')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingMember) {
                // Update existing cell membership
                await supabase
                    .from('cell_members')
                    .update({
                        cell_id: selectedCellId,
                        role: profile.role // Maintain current role
                    })
                    .eq('user_id', user.id);
            } else {
                // Insert new membership
                await supabase
                    .from('cell_members')
                    .insert({
                        cell_id: selectedCellId,
                        user_id: user.id,
                        role: profile.role
                    });
            }

            // 3. Refresh Context
            await refreshProfile();
            setShowModal(false);
            alert('소속 정보가 저장되었습니다.');

        } catch (e: any) {
            console.error('Profile update error:', e);
            alert('저장 중 오류가 발생했습니다: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!showModal) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border-2 border-primary/20">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-4xl text-primary">badge</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        소속 교구/셀 선택
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        원활한 활동을 위해<br />
                        소속된 교구와 셀을 선택해주세요.
                    </p>
                </div>

                <div className="space-y-4">
                    {/* Parish Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                            교구 선택 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedParishId}
                            onChange={(e) => handleParishChange(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all text-lg"
                        >
                            <option value="">교구를 선택하세요</option>
                            {parishes.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cell Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                            셀 선택 <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCellId}
                            onChange={(e) => setSelectedCellId(e.target.value)}
                            disabled={!selectedParishId}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 text-lg"
                        >
                            <option value="">셀을 선택하세요</option>
                            {cells.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        disabled={!selectedParishId || !selectedCellId || loading}
                        className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                저장 중...
                            </>
                        ) : (
                            '저장하고 시작하기'
                        )}
                    </button>
                    {!isAdmin(profile?.role) && (
                        <p className="text-xs text-center text-slate-400 mt-4">
                            * 본인의 소속을 모르시는 경우 관리자에게 문의해주세요.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function isAdmin(role?: string) {
    return role === 'PASTOR' || role === 'SUB_ADMIN' || role === 'LEADER';
}
