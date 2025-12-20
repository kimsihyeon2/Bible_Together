'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useLoading } from '@/lib/loading-context';

interface PlanListScreenProps {
    navigate: (screen: Screen) => void;
    t: Translations;
}

interface ReadingPlan {
    id: string;
    name: string;
    description: string;
    total_days: number;
    cover_image_url: string | null;
}

const PlanListScreen: React.FC<PlanListScreenProps> = ({ navigate, t }) => {
    const { user, isAdmin } = useAuth();
    const { showLoading, hideLoading } = useLoading();
    const [plans, setPlans] = useState<ReadingPlan[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Plan Form State
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');
    const [newPlanDays, setNewPlanDays] = useState('30');
    const [newPlanImage, setNewPlanImage] = useState('');

    const isKorean = t.appName === '그린 바이블';

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        showLoading(isKorean ? '플랜을 불러오는 중...' : 'Loading plans...');
        try {
            const { data, error } = await supabase
                .from('reading_plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        } finally {
            hideLoading();
        }
    };

    const handleCreatePlan = async () => {
        if (!newPlanName || !newPlanDays) return;
        showLoading(isKorean ? '플랜 생성 중...' : 'Creating plan...');

        try {
            const { error } = await supabase.from('reading_plans').insert({
                name: newPlanName,
                description: newPlanDesc,
                total_days: parseInt(newPlanDays),
                cover_image_url: newPlanImage || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
                created_by: user?.id
            });

            if (error) throw error;

            setShowCreateModal(false);
            setNewPlanName('');
            setNewPlanDesc('');
            setNewPlanDays('30');
            setNewPlanImage('');
            fetchPlans();
        } catch (error) {
            console.error('Error creating plan:', error);
            alert(isKorean ? '플랜 생성 실패' : 'Failed to create plan');
        } finally {
            hideLoading();
        }
    };

    return (
        <div className="bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800 min-h-screen pb-24 font-sans text-slate-900 dark:text-white">
            {/* Header */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(Screen.DASHBOARD)}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {isKorean ? '읽기 플랜' : 'Reading Plans'}
                    </h1>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/30 hover:scale-105 transition-transform"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                )}
            </div>

            <main className="px-6 space-y-6">
                {/* Plans Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => {
                                localStorage.setItem('selectedPlanId', plan.id);
                                navigate(Screen.PLAN_DETAIL);
                            }}
                            className="group relative bg-white dark:bg-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 dark:border-slate-700 h-64"
                        >
                            <div className="absolute inset-0">
                                <img
                                    src={plan.cover_image_url || 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800'}
                                    alt={plan.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            </div>

                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                <div className="mb-auto">
                                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold border border-white/30">
                                        {plan.total_days} {isKorean ? '일 완성' : 'Days'}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2 drop-shadow-md">{plan.name}</h3>
                                <p className="text-sm text-white/80 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                    {plan.description}
                                </p>
                            </div>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            <span className="material-symbols-outlined text-4xl mb-2">menu_book</span>
                            <p>{isKorean ? '등록된 플랜이 없습니다.' : 'No plans found.'}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Plan Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-2xl animate-pop max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isKorean ? '새 플랜 만들기' : 'Create New Plan'}</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{isKorean ? '플랜 이름' : 'Plan Name'}</label>
                                <input
                                    type="text"
                                    value={newPlanName}
                                    onChange={(e) => setNewPlanName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-bold text-slate-900 dark:text-white"
                                    placeholder={isKorean ? '예: 요한복음 통독' : 'e.g., Gospel of John'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{isKorean ? '기간 (일)' : 'Duration (Days)'}</label>
                                <input
                                    type="number"
                                    value={newPlanDays}
                                    onChange={(e) => setNewPlanDays(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-bold text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{isKorean ? '설명' : 'Description'}</label>
                                <textarea
                                    value={newPlanDesc}
                                    onChange={(e) => setNewPlanDesc(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium text-slate-900 dark:text-white h-24 resize-none"
                                    placeholder={isKorean ? '플랜에 대한 설명...' : 'Plan description...'}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{isKorean ? '커버 이미지 URL' : 'Cover Image URL'}</label>
                                <input
                                    type="text"
                                    value={newPlanImage}
                                    onChange={(e) => setNewPlanImage(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700 border-none focus:ring-2 focus:ring-green-500 transition-all font-medium text-slate-500 dark:text-slate-400"
                                    placeholder="https://..."
                                />
                            </div>

                            <button
                                onClick={handleCreatePlan}
                                className="w-full h-14 bg-green-500 text-white rounded-[1.5rem] font-bold text-lg shadow-lg shadow-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
                            >
                                {isKorean ? '만들기' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanListScreen;
