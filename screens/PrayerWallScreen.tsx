'use client';

import React, { useState, useEffect } from 'react';
import {
    Heart,
    Briefcase,
    Activity,
    HelpCircle,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    Plus,
    Users,
    ChevronLeft
} from 'lucide-react';
import { Screen } from '../types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Translations } from '@/i18n';

interface Prayer {
    id: string;
    user_id: string;
    title: string;
    content: string;
    category: string;
    is_answered: boolean;
    prayer_count: number;
    created_at: string;
}

interface PrayerWallScreenProps {
    navigate: (screen: Screen) => void;
    t: Translations;
}

const PrayerWallScreen: React.FC<PrayerWallScreenProps> = ({ navigate, t }) => {
    const { user, profile } = useAuth();
    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ONGOING' | 'ANSWERED'>('ONGOING');
    const [showAddModal, setShowAddModal] = useState(false);

    // New Prayer Form State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('Family');

    useEffect(() => {
        if (user) {
            fetchPrayers();
        }
    }, [user, filter]);

    const fetchPrayers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('personal_prayers')
                .select('*')
                .eq('user_id', user?.id)
                .eq('is_answered', filter === 'ANSWERED')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPrayers(data || []);
        } catch (error) {
            console.error('Error fetching prayers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPrayer = async () => {
        if (!user || !newTitle.trim()) return;

        try {
            const { error } = await supabase
                .from('personal_prayers')
                .insert({
                    user_id: user.id,
                    title: newTitle,
                    content: newContent,
                    category: newCategory,
                    is_answered: false,
                    prayer_count: 0
                });

            if (error) throw error;

            setNewTitle('');
            setNewContent('');
            setShowAddModal(false);
            fetchPrayers();
        } catch (error) {
            console.error('Error adding prayer:', error);
        }
    };

    const incrementPrayed = async (id: string, currentCount: number) => {
        try {
            const { error } = await supabase
                .from('personal_prayers')
                .update({ prayer_count: currentCount + 1 })
                .eq('id', id);

            if (error) throw error;

            setPrayers(prev => prev.map(p => p.id === id ? { ...p, prayer_count: p.prayer_count + 1 } : p));
        } catch (error) {
            console.error('Error incrementing prayer count:', error);
        }
    };

    const toggleAnswered = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('personal_prayers')
                .update({ is_answered: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchPrayers();
        } catch (error) {
            console.error('Error toggling answered status:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        // The user wants "오늘, 오후 08:00" style or "n일 전 추가됨"
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1 && date.getDate() === now.getDate()) {
            return t.prayer.addedToday.replace('{time}', timeStr);
        } else {
            return t.prayer.addedDaysAgo.replace('{days}', String(diffDays));
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'family': return <Heart className="w-5 h-5 text-orange-500 fill-orange-500" />;
            case 'guidance': return <Briefcase className="w-5 h-5 text-blue-500 fill-blue-500" />;
            case 'community': return <Users className="w-5 h-5 text-emerald-500 fill-emerald-500" />;
            default: return <HelpCircle className="w-5 h-5 text-gray-500" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'family': return 'bg-orange-100';
            case 'guidance': return 'bg-blue-100';
            case 'community': return 'bg-emerald-100';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50 dark:from-slate-950 dark:to-slate-900 pb-24 font-sans antialiased text-slate-800 dark:text-slate-100">
            {/* Top Header */}
            <header className="pt-8 pb-4 px-6 flex items-center justify-between sticky top-0 bg-gradient-to-b from-teal-50/95 to-teal-50/80 dark:from-slate-950/95 dark:to-slate-950/80 backdrop-blur-sm z-30">
                <button
                    onClick={() => navigate(Screen.DASHBOARD)}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.prayer.title}</h1>
                <div className="w-10 h-10 rounded-full bg-orange-200 dark:bg-orange-900/50 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white font-bold opacity-80">
                            {profile?.name?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>
            </header>

            <main className="px-5">
                {/* Journal Section - Implementation of the Book Page effect */}
                <section className="relative mb-8 mt-2">
                    <div className="bg-[#fefcf8] dark:bg-slate-800 rounded-xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1),inset_16px_0_20px_-10px_rgba(0,0,0,0.05)] border-l-4 border-l-[#e3d8c8] dark:border-l-emerald-900/30 p-6 relative overflow-hidden">
                        {/* Decorative notebook lines */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 notebook-lines mt-10"></div>

                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 font-serif relative z-10">{t.prayer.myPrayers}</h2>
                        <p className="text-slate-600 dark:text-slate-300 italic font-serif text-sm leading-relaxed mb-6 relative z-10 bg-[#fefcf8]/60 dark:bg-slate-800/60 backdrop-blur-[1px] rounded p-1">
                            "{t.prayer.subtitle}"
                        </p>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-full shadow-lg shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 transition-all relative z-10 active:scale-95"
                        >
                            <div className="bg-white/20 p-1 rounded-full">
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                            {t.prayer.addNew}
                        </button>

                        {/* Subtle decorative circle in top right */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-100/50 dark:bg-orange-900/10 rounded-full blur-2xl pointer-events-none"></div>
                    </div>
                </section>

                {/* Tabs */}
                <div className="flex items-end gap-1 mb-6 overflow-x-auto no-scrollbar px-1">
                    <button
                        onClick={() => setFilter('ONGOING')}
                        className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all relative whitespace-nowrap ${filter === 'ONGOING'
                                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] z-10 border-t border-x border-slate-100 dark:border-slate-700'
                                : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60'
                            }`}
                    >
                        {t.prayer.ongoing} <span className="ml-0.5 opacity-70">({prayers.filter(p => !p.is_answered).length})</span>
                        {filter === 'ONGOING' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full"></div>
                        )}
                    </button>

                    <button
                        onClick={() => setFilter('ANSWERED')}
                        className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all relative whitespace-nowrap ${filter === 'ANSWERED'
                                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-[0_-2px_4px_rgba(0,0,0,0.02)] z-10 border-t border-x border-slate-100 dark:border-slate-700'
                                : 'bg-white/40 dark:bg-slate-900/40 text-slate-500 dark:text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/60'
                            }`}
                    >
                        {t.prayer.answered} <span className="ml-0.5 opacity-70">({prayers.filter(p => p.is_answered).length})</span>
                        {filter === 'ANSWERED' && (
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full"></div>
                        )}
                    </button>

                    <button className="px-5 py-2.5 rounded-t-xl text-sm font-semibold bg-white/20 dark:bg-slate-900/20 text-slate-400 dark:text-slate-600 transition-all opacity-60 cursor-not-allowed whitespace-nowrap">
                        {t.prayer.shared}
                    </button>
                </div>

                {/* Prayer List */}
                <div className="space-y-6 min-h-[300px] pb-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-sm mt-4 tracking-tight">기도 노트를 불러오는 중...</p>
                        </div>
                    ) : prayers.length > 0 ? (
                        prayers.map(prayer => (
                            <div key={prayer.id} className="relative mb-6 group animate-pop">
                                {/* Stack effect behind the card */}
                                <div className="absolute inset-x-1 bottom-[-4px] h-full bg-white dark:bg-slate-800/60 rounded-xl border border-stone-200 dark:border-slate-800 shadow-sm z-0"></div>
                                <div className="absolute inset-x-2 bottom-[-8px] h-full bg-white dark:bg-slate-800/40 rounded-xl border border-stone-200 dark:border-slate-800 shadow-sm z-[-1]"></div>

                                <div className="relative bg-[#fdfbf7] dark:bg-slate-800 p-5 rounded-xl border border-stone-100 dark:border-slate-700 shadow-sm z-10 flex flex-col gap-3 group-hover:translate-y-[-2px] transition-transform">
                                    {/* Header: Category & Menu */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${getCategoryColor(prayer.category)} dark:bg-slate-700 transition-colors`}>
                                                {getCategoryIcon(prayer.category)}
                                            </div>
                                            <span className="text-[10px] font-bold tracking-[0.1em] text-slate-400 dark:text-slate-500 uppercase">
                                                {prayer.category === 'Family' ? t.prayer.family :
                                                    prayer.category === 'Guidance' ? t.prayer.guidance :
                                                        prayer.category === 'Community' ? t.prayer.community : prayer.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => toggleAnswered(prayer.id, prayer.is_answered)}
                                                className={`p-1.5 rounded-lg transition-colors ${prayer.is_answered ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-300 hover:text-slate-500'}`}
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                            <button className="p-1.5 text-slate-300 hover:text-slate-500 transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="py-1">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1.5 leading-snug">
                                            {prayer.title}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-[14px] leading-[1.6] border-b border-dashed border-stone-200 dark:border-slate-700 pb-4">
                                            {prayer.content}
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center pt-1">
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatDate(prayer.created_at)}</span>
                                        </div>

                                        <button
                                            onClick={() => incrementPrayed(prayer.id, prayer.prayer_count)}
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all active:scale-95 group/btn"
                                        >
                                            <span className="material-symbols-outlined text-[16px] group-active/btn:scale-125 transition-transform">spa</span>
                                            <span className="text-[12px] font-bold">{t.prayer.prayedCount.replace('{count}', String(prayer.prayer_count))}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <span className="material-symbols-outlined text-5xl mb-4 opacity-20">spa</span>
                            <p className="text-sm font-medium">{filter === 'ONGOING' ? '진행 중인 기도가 없습니다.' : '응답 완료된 기도가 없습니다.'}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Add Prayer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">새 기도 제목 추가</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form className="p-5 space-y-5" onSubmit={(e) => { e.preventDefault(); handleAddPrayer(); }}>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">카테고리</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {['Family', 'Guidance', 'Community'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNewCategory(cat)}
                                            className={`px-4 py-2 text-[12px] font-bold rounded-full border transition-all whitespace-nowrap ${newCategory === cat
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                                }`}
                                        >
                                            {cat === 'Family' ? t.prayer.family :
                                                cat === 'Guidance' ? t.prayer.guidance :
                                                    cat === 'Community' ? t.prayer.community : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">기도 제목</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder={t.prayer.placeholderTitle}
                                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">내용</label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder={t.prayer.placeholderContent}
                                    rows={4}
                                    className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none bg-stone-50/50 dark:bg-slate-900/50 leading-relaxed"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl active:scale-95 transition-all text-sm"
                                >
                                    {t.prayer.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 transition-all text-sm"
                                >
                                    {t.prayer.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrayerWallScreen;
