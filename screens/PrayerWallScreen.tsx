'use client';

import React, { useState, useEffect } from 'react';
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
            alert(t.prayer.successAdd);
        } catch (error) {
            console.error('Error adding prayer:', error);
            alert('Failed to add prayer.');
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
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            return t.prayer.addedToday.replace('{time}', date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
            return t.prayer.addedDaysAgo.replace('{days}', String(diffDays));
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'family': return 'favorite';
            case 'guidance': return 'work';
            case 'community': return 'groups';
            default: return 'bookmark';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'family': return 'bg-orange-100 text-orange-500 dark:bg-orange-900/50 dark:text-orange-300';
            case 'guidance': return 'bg-blue-100 text-blue-500 dark:bg-blue-900/50 dark:text-blue-300';
            case 'community': return 'bg-purple-100 text-purple-500 dark:bg-purple-900/50 dark:text-purple-300';
            default: return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    return (
        <div className="font-display antialiased text-gray-800 dark:text-gray-100 bg-background-light dark:bg-background-dark min-h-screen relative overflow-hidden pb-24">
            {/* SOTA Background Elements */}
            <div className="fixed inset-0 z-0 pasture-bg dark:pasture-bg-dark transition-colors duration-500 opacity-60">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-yellow-200/40 dark:bg-yellow-600/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-green-200/50 to-transparent dark:from-emerald-900/50 pointer-events-none rounded-t-[50%] scale-150 translate-y-20"></div>
            </div>

            <div className="relative z-10 flex flex-col max-w-md mx-auto h-full">
                {/* Header */}
                <header className="px-6 pt-12 pb-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate(Screen.DASHBOARD)}
                        className="p-2 -ml-2 rounded-full hover:bg-white/20 active:scale-95 transition text-slate-600 dark:text-slate-200"
                    >
                        <span className="material-icons-round text-2xl">arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-xl font-bold text-slate-700 dark:text-white tracking-wide">{t.prayer.title}</h1>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 dark:border-slate-600 shadow-sm">
                        {profile?.avatar_url ? (
                            <img alt="Profile" className="w-full h-full object-cover" src={profile.avatar_url} />
                        ) : (
                            <div className="w-full h-full bg-primary flex items-center justify-center text-white font-bold">
                                {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-6">
                    {/* Welcome Card - SOTA Paper Design */}
                    <div className="glass dark:glass-dark rounded-3xl p-6 shadow-soft relative overflow-hidden group border border-white/50 dark:border-white/10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100/80 to-transparent dark:from-orange-900/10 rounded-bl-full pointer-events-none"></div>
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t.prayer.myPrayers}</h2>
                            <p className="text-slate-500 dark:text-slate-300 text-sm mb-6 leading-relaxed italic">
                                {t.prayer.subtitle}
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 shadow-glow transition-all active:scale-95 mb-1"
                            >
                                <span className="material-icons-round">add_circle</span>
                                <span>{t.prayer.addNew}</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 pt-2">
                        <button
                            onClick={() => setFilter('ONGOING')}
                            className={`${filter === 'ONGOING'
                                ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-400 ring-2 ring-primary/20'
                                : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-white/50 dark:border-slate-600'} 
                                font-bold px-6 py-2.5 rounded-full shadow-sm text-sm border whitespace-nowrap backdrop-blur-sm transition-all`}
                        >
                            {t.prayer.ongoing} ({prayers.filter(p => !p.is_answered).length || 0})
                        </button>
                        <button
                            onClick={() => setFilter('ANSWERED')}
                            className={`${filter === 'ANSWERED'
                                ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-400 ring-2 ring-primary/20'
                                : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-white/50 dark:border-slate-600'} 
                                font-bold px-6 py-2.5 rounded-full shadow-sm text-sm border whitespace-nowrap backdrop-blur-sm transition-all`}
                        >
                            {t.prayer.answered}
                        </button>
                    </div>

                    {/* Prayer Cards */}
                    <div className="space-y-4 pb-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400 text-sm">Loading prayers...</p>
                            </div>
                        ) : prayers.length === 0 ? (
                            <div className="text-center py-20 px-10 text-slate-400 bg-white/30 dark:bg-slate-800/20 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                <span className="material-icons-round text-5xl mb-4 block opacity-30">spa</span>
                                <p>{filter === 'ONGOING' ? 'No ongoing prayers yet.' : 'No answered prayers yet.'}</p>
                            </div>
                        ) : (
                            prayers.map((prayer) => (
                                <div key={prayer.id} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-white/60 dark:border-slate-700/50 group hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center space-x-3">
                                            <span className={`${getCategoryColor(prayer.category)} p-2 rounded-xl`}>
                                                <span className="material-icons-round text-lg">{getCategoryIcon(prayer.category)}</span>
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                {prayer.category}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => toggleAnswered(prayer.id, prayer.is_answered)}
                                                className={`p-1.5 rounded-lg transition-colors ${prayer.is_answered ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'}`}
                                                title={prayer.is_answered ? 'Mark as ongoing' : 'Mark as answered'}
                                            >
                                                <span className="material-icons-round text-xl">check_circle</span>
                                            </button>
                                            <button className="text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400">
                                                <span className="material-icons-round">more_horiz</span>
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">{prayer.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">
                                        {prayer.content}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-3">
                                        <div className="flex items-center text-[11px] text-slate-400 dark:text-slate-500">
                                            <span className="material-icons-round text-sm mr-1">schedule</span>
                                            <span>{formatDate(prayer.created_at)}</span>
                                        </div>
                                        <button
                                            onClick={() => incrementPrayed(prayer.id, prayer.prayer_count)}
                                            className="flex items-center space-x-1.5 text-primary text-[11px] font-bold bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
                                        >
                                            <span className="material-icons-round text-[14px]">spa</span>
                                            <span>{t.prayer.prayedCount.replace('{count}', String(prayer.prayer_count))}</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>

            {/* Add Prayer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 relative z-10 shadow-2xl transition-all scale-100 animate-in fade-in zoom-in duration-300">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                            <span className="bg-primary/10 p-2 rounded-xl mr-3">
                                <span className="material-icons-round text-primary">edit_note</span>
                            </span>
                            {t.prayer.addNew}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Category</label>
                                <div className="flex space-x-2">
                                    {['Family', 'Guidance', 'Community'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setNewCategory(cat)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${newCategory === cat ? 'bg-primary text-white shadow-glow' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <input
                                type="text"
                                placeholder={t.prayer.placeholderTitle}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-5 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50 transition-all font-bold"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />

                            <textarea
                                placeholder={t.prayer.placeholderContent}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 px-5 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50 transition-all min-h-[120px]"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                            />

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    {t.prayer.cancel}
                                </button>
                                <button
                                    onClick={handleAddPrayer}
                                    className="flex-2 bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-2xl shadow-glow transition-all active:scale-95 flex-grow"
                                >
                                    {t.prayer.save}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrayerWallScreen;
