'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    const [allPrayers, setAllPrayers] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ONGOING' | 'ANSWERED'>('ONGOING');

    // Edit/Add Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);

    // ★ 새로운 접근: Bottom Action Sheet
    const [actionSheetPrayer, setActionSheetPrayer] = useState<Prayer | null>(null);

    // Delete Confirmation
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetPrayer, setDeleteTargetPrayer] = useState<Prayer | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Family');

    // Verse cycling
    const [verseIndex, setVerseIndex] = useState(0);
    const [verseFading, setVerseFading] = useState(false);

    // Computed values
    const ongoingPrayers = allPrayers.filter(p => !p.is_answered);
    const answeredPrayers = allPrayers.filter(p => p.is_answered);
    const displayedPrayers = filter === 'ONGOING' ? ongoingPrayers : answeredPrayers;

    const fetchAllPrayers = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('personal_prayers')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllPrayers(data || []);
        } catch (error) {
            console.error('Error fetching prayers:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchAllPrayers();
    }, [user, fetchAllPrayers]);

    useEffect(() => {
        const interval = setInterval(() => {
            setVerseFading(true);
            setTimeout(() => {
                setVerseIndex((prev) => (prev + 1) % PRAYER_VERSES.length);
                setVerseFading(false);
            }, 300);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // =============================================
    // ACTION SHEET 방식 (새로운 접근)
    // =============================================

    const openActionSheet = (prayer: Prayer) => {
        setActionSheetPrayer(prayer);
    };

    const closeActionSheet = () => {
        setActionSheetPrayer(null);
    };

    // 편집 모달 열기
    const handleEditFromSheet = () => {
        if (!actionSheetPrayer) return;
        setEditingPrayer(actionSheetPrayer);
        setTitle(actionSheetPrayer.title);
        setContent(actionSheetPrayer.content);
        setCategory(actionSheetPrayer.category);
        closeActionSheet();
        setTimeout(() => setIsModalOpen(true), 100);
    };

    // 삭제 확인 모달 열기
    const handleDeleteFromSheet = () => {
        if (!actionSheetPrayer) return;
        setDeleteTargetPrayer(actionSheetPrayer);
        closeActionSheet();
        setTimeout(() => setIsDeleteModalOpen(true), 100);
    };

    // 새 기도 추가
    const openAddModal = () => {
        setEditingPrayer(null);
        setTitle('');
        setContent('');
        setCategory('Family');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setEditingPrayer(null);
            setTitle('');
            setContent('');
            setCategory('Family');
        }, 200);
    };

    const handleSavePrayer = async () => {
        if (!user || !title.trim()) return;
        closeModal();

        try {
            if (editingPrayer) {
                const { error } = await supabase
                    .from('personal_prayers')
                    .update({ title, content, category })
                    .eq('id', editingPrayer.id);
                if (error) throw error;
                setAllPrayers(prev => prev.map(p =>
                    p.id === editingPrayer.id ? { ...p, title, content, category } : p
                ));
            } else {
                const { error, data } = await supabase
                    .from('personal_prayers')
                    .insert({
                        user_id: user.id,
                        title,
                        content,
                        category,
                        is_answered: false,
                        prayer_count: 0
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (data) setAllPrayers(prev => [data, ...prev]);
            }
        } catch (error) {
            console.error('Error saving prayer:', error);
            alert('저장에 실패했습니다.');
            fetchAllPrayers();
        }
    };

    const handleDeletePrayer = async () => {
        if (!deleteTargetPrayer) return;
        const id = deleteTargetPrayer.id;
        setAllPrayers(prev => prev.filter(p => p.id !== id));
        setIsDeleteModalOpen(false);
        setDeleteTargetPrayer(null);

        try {
            const { error } = await supabase
                .from('personal_prayers')
                .delete()
                .eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error deleting prayer:', error);
            alert('삭제에 실패했습니다.');
            fetchAllPrayers();
        }
    };

    const incrementPrayed = async (id: string, currentCount: number) => {
        setAllPrayers(prev => prev.map(p =>
            p.id === id ? { ...p, prayer_count: p.prayer_count + 1 } : p
        ));

        try {
            const { error } = await supabase
                .from('personal_prayers')
                .update({ prayer_count: currentCount + 1 })
                .eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error:', error);
            fetchAllPrayers();
        }
    };

    const toggleAnswered = async (id: string, currentStatus: boolean) => {
        setAllPrayers(prev => prev.map(p =>
            p.id === id ? { ...p, is_answered: !currentStatus } : p
        ));

        try {
            const { error } = await supabase
                .from('personal_prayers')
                .update({ is_answered: !currentStatus })
                .eq('id', id);
            if (error) throw error;
        } catch (error) {
            console.error('Error:', error);
            fetchAllPrayers();
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
            {/* Header */}
            <header className="pt-8 pb-4 px-6 flex items-center justify-between sticky top-0 bg-stone-50/95 dark:bg-slate-950/95 z-30 border-b border-stone-100 dark:border-slate-800">
                <button
                    onClick={() => navigate(Screen.DASHBOARD)}
                    className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">{t.prayer.title}</h1>
                <div className="w-10 h-10 rounded-full bg-orange-200 dark:bg-orange-900/50 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                            {profile?.name?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>
            </header>

            <main className="px-5 max-w-2xl mx-auto pt-6">
                {/* Journal Section */}
                <section className="relative mb-8">
                    <div className="bg-[#fefcf8] dark:bg-slate-800 rounded-xl shadow-sm border border-[#e5e5e5] dark:border-slate-700 p-6">
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-orange-400" />
                            {t.prayer.myPrayers}
                        </h2>

                        <div className="h-[100px] mb-6 flex items-start overflow-hidden">
                            <p className={`italic text-[15px] leading-[32px] transition-opacity duration-300 ${verseFading ? 'opacity-0' : 'opacity-100'}`}>
                                "{PRAYER_VERSES[verseIndex]}"
                            </p>
                        </div>

                        <button
                            onClick={openAddModal}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-full shadow-md flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {t.prayer.addNew}
                        </button>
                    </div>
                </section>

                {/* Tabs */}
                <div className="flex items-end gap-1 mb-6 px-1">
                    <button
                        onClick={() => setFilter('ONGOING')}
                        className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors relative ${filter === 'ONGOING' ? 'bg-white dark:bg-slate-800 text-emerald-700' : 'text-slate-500'}`}
                    >
                        {t.prayer.ongoing} ({ongoingPrayers.length})
                        {filter === 'ONGOING' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
                    </button>
                    <button
                        onClick={() => setFilter('ANSWERED')}
                        className={`px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-colors relative ${filter === 'ANSWERED' ? 'bg-white dark:bg-slate-800 text-emerald-700' : 'text-slate-500'}`}
                    >
                        {t.prayer.answered} ({answeredPrayers.length})
                        {filter === 'ANSWERED' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500" />}
                    </button>
                </div>

                {/* Prayer List */}
                <div className="space-y-4 min-h-[300px] pb-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-slate-400 text-sm mt-4">로딩 중...</p>
                        </div>
                    ) : displayedPrayers.length > 0 ? (
                        displayedPrayers.map((prayer) => {
                            const catStyle = getCategoryStyle(prayer.category);

                            return (
                                <div key={prayer.id} className="bg-[#fdfbf7] dark:bg-slate-800 p-5 rounded-xl border border-stone-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${catStyle.bg} ${catStyle.text}`}>
                                                {catStyle.icon}
                                            </div>
                                            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                                                {prayer.category === 'Family' ? t.prayer.family :
                                                    prayer.category === 'Guidance' ? t.prayer.guidance :
                                                        prayer.category === 'Community' ? t.prayer.community : prayer.category}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => toggleAnswered(prayer.id, prayer.is_answered)}
                                                className={`p-2 rounded-lg ${prayer.is_answered ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300'}`}
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>

                                            {/* ★ 메뉴 버튼 - Action Sheet 열기 */}
                                            <button
                                                onClick={() => openActionSheet(prayer)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                            >
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="py-3">
                                        <h3 className="text-lg font-bold mb-2">{prayer.title}</h3>
                                        <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap">
                                            {prayer.content}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-dashed border-stone-200">
                                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{formatDate(prayer.created_at)}</span>
                                        </div>

                                        <button
                                            onClick={() => incrementPrayed(prayer.id, prayer.prayer_count)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs"
                                        >
                                            🙏 {t.prayer.prayedCount.replace('{count}', String(prayer.prayer_count))}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/30 rounded-3xl border border-dashed">
                            <span className="text-5xl mb-4 opacity-20">🙏</span>
                            <p className="text-sm">{filter === 'ONGOING' ? '진행 중인 기도가 없습니다.' : '응답 완료된 기도가 없습니다.'}</p>
                        </div>
                    )}
                </div>
            </main>

            {/* ★★★ BOTTOM ACTION SHEET (새로운 방식) ★★★ */}
            {actionSheetPrayer && (
                <div className="fixed inset-0 z-[200]">
                    {/* 배경 오버레이 */}
                    <div
                        className="absolute inset-0 bg-black/50 transition-opacity"
                        onClick={closeActionSheet}
                    />

                    {/* 하단 시트 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl animate-slide-up">
                        {/* 헤더 */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">기도 제목</p>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                    {actionSheetPrayer.title}
                                </h3>
                            </div>
                            <button
                                onClick={closeActionSheet}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-700"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* 액션 버튼들 */}
                        <div className="p-4 space-y-2">
                            <button
                                onClick={handleEditFromSheet}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Edit2 className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-800 dark:text-white">편집하기</p>
                                    <p className="text-sm text-slate-500">기도 제목 내용을 수정합니다</p>
                                </div>
                            </button>

                            <button
                                onClick={handleDeleteFromSheet}
                                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-red-600 dark:text-red-400">삭제하기</p>
                                    <p className="text-sm text-red-400">이 기도 제목을 삭제합니다</p>
                                </div>
                            </button>
                        </div>

                        {/* 취소 버튼 */}
                        <div className="p-4 pt-0">
                            <button
                                onClick={closeActionSheet}
                                className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl"
                            >
                                취소
                            </button>
                        </div>

                        {/* Safe area */}
                        <div className="h-6 bg-white dark:bg-slate-800" />
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && deleteTargetPrayer && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 relative z-10">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2">기도 제목 삭제</h3>
                        <p className="text-slate-500 text-center text-sm mb-6">
                            "{deleteTargetPrayer.title}"<br />
                            정말 삭제하시겠습니까?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeletePrayer}
                                className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-xl relative z-10 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
                            <h2 className="text-xl font-bold">
                                {editingPrayer ? '기도 제목 수정' : '새 기도 제목'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); handleSavePrayer(); }}>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">카테고리</label>
                                <div className="flex gap-2">
                                    {['Family', 'Guidance', 'Community'].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className={`px-4 py-2 text-xs font-bold rounded-full border ${category === cat
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            {cat === 'Family' ? t.prayer.family :
                                                cat === 'Guidance' ? t.prayer.guidance :
                                                    t.prayer.community}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">기도 제목</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t.prayer.placeholderTitle}
                                    className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 font-bold text-lg"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">내용</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder={t.prayer.placeholderContent}
                                    rows={4}
                                    className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-emerald-500 text-white font-bold rounded-xl"
                                >
                                    {editingPrayer ? '수정하기' : '추가하기'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CSS for animation */}
            <style jsx global>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default PrayerWallScreen;
