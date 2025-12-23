'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Heart,
    Briefcase,
    HelpCircle,
    MoreHorizontal,
    CheckCircle2,
    Clock,
    Plus,
    Users,
    ChevronLeft,
    Sparkles,
    Trash2,
    Edit2,
    X
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

const PRAYER_VERSES = [
    "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라 (빌 4:6)",
    "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 (살전 5:16-18)",
    "너는 내게 부르짖으라 내가 네게 응답하겠고 네가 알지 못하는 크고 은밀한 일을 네게 보이리라 (렘 33:3)",
    "시험에 들지 않게 깨어 기도하라 마음에는 원이로되 육신이 약하도다 (마 26:41)",
    "기도를 계속하고 기도에 감사함으로 깨어 있으라 (골 4:2)",
    "내 이름으로 무엇이든지 내게 구하면 내가 행하리라 (요 14:14)",
    "우리가 구하거나 생각하는 모든 것에 더 넘치도록 능히 하실 이에게 (엡 3:20)"
];

const PrayerWallScreen: React.FC<PrayerWallScreenProps> = ({ navigate, t }) => {
    const { user, profile } = useAuth();
    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ONGOING' | 'ANSWERED'>('ONGOING');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Modal state - completely separate
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Family');

    // Dynamic Verse State
    const [verseIndex, setVerseIndex] = useState(0);

    useEffect(() => {
        if (user) {
            fetchPrayers();
        }
    }, [user, filter]);

    useEffect(() => {
        const interval = setInterval(() => {
            setVerseIndex((prev) => (prev + 1) % PRAYER_VERSES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Modal animation handling with CSS
    useEffect(() => {
        if (isModalOpen) {
            // Modal is opening - trigger animation after a frame
            requestAnimationFrame(() => {
                setIsModalVisible(true);
            });
        }
    }, [isModalOpen]);

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

    const openModal = useCallback((prayer?: Prayer) => {
        if (prayer) {
            setEditingPrayer(prayer);
            setTitle(prayer.title);
            setContent(prayer.content);
            setCategory(prayer.category);
        } else {
            setEditingPrayer(null);
            setTitle('');
            setContent('');
            setCategory('Family');
        }
        setActiveMenuId(null);
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalVisible(false);
        // Wait for CSS animation to complete before removing from DOM
        setTimeout(() => {
            setIsModalOpen(false);
            setEditingPrayer(null);
            setTitle('');
            setContent('');
            setCategory('Family');
        }, 200);
    }, []);

    const handleSavePrayer = async () => {
        if (!user || !title.trim()) return;

        try {
            if (editingPrayer) {
                const { error } = await supabase
                    .from('personal_prayers')
                    .update({ title, content, category })
                    .eq('id', editingPrayer.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('personal_prayers')
                    .insert({
                        user_id: user.id,
                        title,
                        content,
                        category,
                        is_answered: false,
                        prayer_count: 0
                    });
                if (error) throw error;
            }

            closeModal();
            fetchPrayers();
        } catch (error) {
            console.error('Error saving prayer:', error);
        }
    };

    const handleDeletePrayer = async (id: string) => {
        setActiveMenuId(null);
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            const { error } = await supabase
                .from('personal_prayers')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchPrayers();
        } catch (error) {
            console.error('Error deleting prayer:', error);
        }
    };

    const handleEditClick = useCallback((e: React.MouseEvent, prayer: Prayer) => {
        e.preventDefault();
        e.stopPropagation();
        openModal(prayer);
    }, [openModal]);

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
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1 && date.getDate() === now.getDate()) {
            return t.prayer.addedToday.replace('{time}', timeStr);
        } else {
            return t.prayer.addedDaysAgo.replace('{days}', String(diffDays));
        }
    };

    const getCategoryStyle = (cat: string) => {
        switch (cat.toLowerCase()) {
            case 'family': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', icon: <Heart className="w-4 h-4 fill-current" /> };
            case 'guidance': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: <Briefcase className="w-4 h-4 fill-current" /> };
            case 'community': return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', icon: <Users className="w-4 h-4 fill-current" /> };
            default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: <HelpCircle className="w-4 h-4" /> };
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-slate-950 pb-24 font-sans text-slate-800 dark:text-slate-100 overflow-x-hidden">
            {/* CSS for animations - inline for simplicity */}
            <style jsx global>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0.5; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100%); opacity: 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .modal-overlay-enter { animation: fadeIn 0.15s ease-out forwards; }
                .modal-overlay-exit { animation: fadeOut 0.15s ease-in forwards; }
                .modal-content-enter { animation: slideUp 0.2s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
                .modal-content-exit { animation: slideDown 0.15s ease-in forwards; }
            `}</style>

            {/* Top Header */}
            <header className="pt-8 pb-4 px-6 flex items-center justify-between sticky top-0 bg-stone-50/95 dark:bg-slate-950/95 z-30 border-b border-stone-100 dark:border-slate-800">
                <button
                    onClick={() => navigate(Screen.DASHBOARD)}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                    {t.prayer.title}
                </h1>
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

            <main className="px-5 max-w-2xl mx-auto pt-6">
                {/* Journal Section */}
                <section className="relative mb-8">
                    <div className="bg-[#fefcf8] dark:bg-slate-800 rounded-xl shadow-sm border border-[#e5e5e5] dark:border-slate-700 p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40 notebook-lines"></div>

                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 font-serif relative z-10 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-orange-400" />
                            {t.prayer.myPrayers}
                        </h2>

                        {/* Fixed height verse container - prevents layout shift */}
                        <div className="h-[100px] mb-6 relative z-10 flex items-start overflow-hidden">
                            <p
                                key={verseIndex}
                                className="text-slate-700 dark:text-slate-200 italic font-serif text-[15px] leading-[32px] bg-[#fefcf8]/90 dark:bg-slate-800/90 rounded p-2 shadow-sm transition-opacity duration-300 line-clamp-3"
                            >
                                "{PRAYER_VERSES[verseIndex]}"
                            </p>
                        </div>

                        <button
                            onClick={() => openModal()}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold py-3.5 px-4 rounded-full shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] relative z-10"
                        >
                            <div className="bg-white/20 p-1 rounded-full">
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                            {t.prayer.addNew}
                        </button>
                    </div>
                </section>

                {/* Tabs */}
                <div className="flex items-end gap-1 mb-6 px-1">
                    <button
                        onClick={() => setFilter('ONGOING')}
                        className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors relative whitespace-nowrap ${filter === 'ONGOING'
                            ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-t border-x border-slate-200 dark:border-slate-700'
                            : 'bg-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t.prayer.ongoing} <span className="ml-0.5 opacity-70">({prayers.filter(p => !p.is_answered).length})</span>
                        {filter === 'ONGOING' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                    </button>

                    <button
                        onClick={() => setFilter('ANSWERED')}
                        className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors relative whitespace-nowrap ${filter === 'ANSWERED'
                            ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-t border-x border-slate-200 dark:border-slate-700'
                            : 'bg-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {t.prayer.answered} <span className="ml-0.5 opacity-70">({prayers.filter(p => p.is_answered).length})</span>
                        {filter === 'ANSWERED' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                    </button>
                </div>

                {/* Prayer List */}
                <div className="space-y-4 min-h-[300px] pb-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-sm mt-4">로딩 중...</p>
                        </div>
                    ) : prayers.length > 0 ? (
                        prayers.map((prayer) => {
                            const catStyle = getCategoryStyle(prayer.category);
                            return (
                                <div key={prayer.id} className="relative">
                                    <div className="bg-[#fdfbf7] dark:bg-slate-800 p-5 rounded-xl border border-stone-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                                        <div className="absolute inset-0 pointer-events-none opacity-20 notebook-lines bg-[size:100%_28px] mt-12 px-5 rounded-xl"></div>

                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-lg ${catStyle.bg} ${catStyle.text}`}>
                                                    {catStyle.icon}
                                                </div>
                                                <span className="text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                                                    {prayer.category === 'Family' ? t.prayer.family :
                                                        prayer.category === 'Guidance' ? t.prayer.guidance :
                                                            prayer.category === 'Community' ? t.prayer.community : prayer.category}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1 relative">
                                                <button
                                                    onClick={() => toggleAnswered(prayer.id, prayer.is_answered)}
                                                    className={`p-2 rounded-lg transition-colors ${prayer.is_answered ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-300 hover:text-slate-500'}`}
                                                >
                                                    <CheckCircle2 className="w-5 h-5" />
                                                </button>

                                                {/* Menu Trigger */}
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setActiveMenuId(activeMenuId === prayer.id ? null : prayer.id)}
                                                        className={`p-2 rounded-lg transition-colors ${activeMenuId === prayer.id ? 'bg-slate-100 dark:bg-slate-700 text-slate-600' : 'text-slate-300 hover:text-slate-500'}`}
                                                    >
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </button>

                                                    {/* Dropdown Menu - Pure CSS */}
                                                    {activeMenuId === prayer.id && (
                                                        <>
                                                            {/* Invisible overlay to close menu on outside click */}
                                                            <div
                                                                className="fixed inset-0 z-40"
                                                                onClick={() => setActiveMenuId(null)}
                                                            />
                                                            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-1.5 z-50">
                                                                <button
                                                                    onClick={(e) => handleEditClick(e, prayer)}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-left font-medium"
                                                                >
                                                                    <Edit2 className="w-4 h-4" /> 편집하기
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePrayer(prayer.id)}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-left font-medium"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> 삭제하기
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="py-1 relative z-10">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                                                {prayer.title}
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-[32px] min-h-[2em]">
                                                {prayer.content}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-dashed border-stone-200 dark:border-stone-700 relative z-10">
                                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{formatDate(prayer.created_at)}</span>
                                            </div>

                                            <button
                                                onClick={() => incrementPrayed(prayer.id, prayer.prayer_count)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors font-bold text-xs"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">spa</span>
                                                {t.prayer.prayedCount.replace('{count}', String(prayer.prayer_count))}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/30 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                            <span className="material-symbols-outlined text-5xl mb-4 opacity-20">spa</span>
                            <p className="text-sm font-medium">{filter === 'ONGOING' ? '진행 중인 기도가 없습니다.' : '응답 완료된 기도가 없습니다.'}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* SOTA Modal - Pure CSS Animations for Maximum Performance */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div
                        onClick={closeModal}
                        className={`absolute inset-0 bg-black/50 ${isModalVisible ? 'modal-overlay-enter' : 'modal-overlay-exit'}`}
                    />

                    <div
                        className={`w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-xl overflow-hidden relative z-10 ${isModalVisible ? 'modal-content-enter' : 'modal-content-exit'}`}
                    >
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingPrayer ? '기도 제목 수정' : '새 기도 제목 추가'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form className="p-6 space-y-6" onSubmit={(e) => { e.preventDefault(); handleSavePrayer(); }}>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">카테고리</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {['Family', 'Guidance', 'Community'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`px-4 py-2 text-xs font-bold rounded-full border transition-all whitespace-nowrap ${category === cat
                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-300'
                                                }`}
                                        >
                                            {cat === 'Family' ? t.prayer.family :
                                                cat === 'Guidance' ? t.prayer.guidance :
                                                    cat === 'Community' ? t.prayer.community : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">기도 제목</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t.prayer.placeholderTitle}
                                    className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">내용</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={t.prayer.placeholderContent}
                                    rows={4}
                                    className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none leading-relaxed text-sm"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold rounded-xl active:scale-95 transition-transform"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
                                >
                                    {editingPrayer ? t.prayer.save : '추가하기'}
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
