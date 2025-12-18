'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useBible } from '@/lib/bible-context';

interface BibleScreenProps {
    navigate: (screen: Screen) => void;
    t: Translations;
}

// Bible book names in Korean
const BIBLE_BOOKS = [
    // 구약
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기',
    '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야',
    '에스더', '욥기', '시편', '잠언', '전도서', '아가', '이사야', '예레미야', '예레미야애가',
    '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔',
    '하박국', '스바냐', '학개', '스가랴', '말라기',
    // 신약
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전', '로마서', '고린도전서', '고린도후서',
    '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서', '데살로니가후서',
    '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서', '야고보서', '베드로전서',
    '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서', '요한계시록'
];

type BibleData = {
    [book: string]: {
        [chapter: string]: {
            [verse: string]: string;
        };
    };
};

const { isLoaded, getVerses: getVersesFromContext, getChapterCount: getChapterCountFromContext } = useBible();
const { user, profile } = useAuth();
// const [bibleData, setBibleData] = useState<BibleData | null>(null); // Removed
const [loading, setLoading] = useState(true); // Kept for initial setup
const [selectedBook, setSelectedBook] = useState<string>('창세기');
const [selectedChapter, setSelectedChapter] = useState<number>(1);

// ... (other states)

// Wait for Bible Load
useEffect(() => {
    if (isLoaded) {
        setLoading(false);
    }
}, [isLoaded]);

// Removed fetch logic

// ...

const getChapterCount = (book: string) => getChapterCountFromContext(book);

const getVerses = () => getVersesFromContext(selectedBook, selectedChapter);

if (loading || !isLoaded) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-600 dark:text-slate-400">성경을 불러오는 중...</p>
            </div>
        </div>
    );
}

return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-white pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-black/5 dark:border-white/10">
            <div className="flex items-center justify-between px-4 py-3">
                <button
                    onClick={() => navigate(Screen.DASHBOARD)}
                    className="p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>

                <div className="flex items-center gap-2">
                    {/* Book selector */}
                    <button
                        onClick={() => setShowBookPicker(true)}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold flex items-center gap-1"
                    >
                        {selectedBook}
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>

                    {/* Chapter selector */}
                    <button
                        onClick={() => setShowChapterPicker(true)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-semibold flex items-center gap-1"
                    >
                        {selectedChapter}장
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>
                </div>

                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 -mr-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">settings</span>
                </button>
            </div>
        </header>

        {/* Bible Content */}
        <main className="px-5 py-6">
            <h1 className="text-2xl font-bold mb-6 text-center">
                {selectedBook} {selectedChapter}장
            </h1>

            <div className="space-y-2">
                {getVerses().map(([verseNumStr, text]) => {
                    const verseNum = parseInt(verseNumStr);
                    const vHighlights = highlights.filter(h => h.verse === verseNum);
                    const myHighlight = vHighlights.find(h => h.user_id === user?.id);
                    const otherHighlights = vHighlights.filter(h => h.user_id !== user?.id);

                    // Determine style
                    const primaryHighlight = myHighlight || otherHighlights[0];

                    // Map colors to tailwind classes for border/bg
                    const getBorderColor = (c: string) => {
                        switch (c) {
                            case 'yellow': return 'border-yellow-400 dark:border-yellow-600';
                            case 'green': return 'border-green-400 dark:border-green-600';
                            case 'blue': return 'border-blue-400 dark:border-blue-600';
                            case 'pink': return 'border-pink-400 dark:border-pink-600';
                            default: return 'border-primary';
                        }
                    };

                    const getBgColor = (c: string) => {
                        switch (c) {
                            case 'yellow': return 'bg-yellow-400/20 dark:bg-yellow-600/20';
                            case 'green': return 'bg-green-400/20 dark:bg-green-600/20';
                            case 'blue': return 'bg-blue-400/20 dark:bg-blue-600/20';
                            case 'pink': return 'bg-pink-400/20 dark:bg-pink-600/20';
                            default: return 'bg-primary/20';
                        }
                    };

                    const borderColor = primaryHighlight ? getBorderColor(primaryHighlight.color) : 'border-transparent';
                    const bgColor = primaryHighlight ? getBgColor(primaryHighlight.color) : 'bg-transparent';

                    return (
                        <div
                            key={verseNum}
                            className={`flex gap-3 py-1 px-2 rounded-lg transition-colors cursor-pointer ${primaryHighlight ? bgColor : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            onClick={() => setActiveVerse(verseNum)}
                        >
                            <span className="text-slate-400 font-bold text-xs min-w-[20px] text-right pt-2 select-none">
                                {verseNum}
                            </span>
                            <div className="flex-1">
                                <p
                                    className={`leading-relaxed transition-all`}
                                    style={{
                                        fontSize: `${fontSize}px`,
                                        lineHeight: lineHeight,
                                        // We use border-bottom on text for "reading mode" feel
                                        borderBottomWidth: primaryHighlight ? '2px' : '0px',
                                    }}
                                >
                                    <span className={`${primaryHighlight ? borderColor : ''} border-b-0`}>
                                        {text}
                                    </span>
                                </p>
                                {/* Shared Indicators */}
                                {otherHighlights.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                        {otherHighlights.map(h => (
                                            <span key={h.id} className="text-[10px] bg-white/50 dark:bg-black/20 text-slate-500 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                                                {h.user_name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 gap-4">
                <button
                    onClick={() => {
                        if (selectedChapter > 1) {
                            setSelectedChapter(selectedChapter - 1);
                        } else {
                            const currentBookIndex = BIBLE_BOOKS.indexOf(selectedBook);
                            if (currentBookIndex > 0) {
                                const prevBook = BIBLE_BOOKS[currentBookIndex - 1];
                                setSelectedBook(prevBook);
                                setSelectedChapter(getChapterCount(prevBook));
                            }
                        }
                        window.scrollTo(0, 0);
                    }}
                    disabled={selectedBook === '창세기' && selectedChapter === 1}
                    className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                    이전
                </button>
                <button
                    onClick={async () => {
                        // Record reading activity
                        try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                                // 1. Get user's cell
                                const { data: cellMember } = await supabase
                                    .from('cell_members')
                                    .select('cell_id')
                                    .eq('user_id', user.id)
                                    .maybeSingle();

                                if (cellMember) {
                                    // 2. Add to Activity Feed
                                    await supabase.from('cell_activities').insert({
                                        cell_id: cellMember.cell_id,
                                        user_id: user.id,
                                        type: 'READING',
                                        title: `${selectedBook} ${selectedChapter}장을 읽었습니다`,
                                        data: {
                                            book: selectedBook,
                                            chapter: selectedChapter
                                        }
                                    });

                                    // 3. Update Daily Reading (for Streak & Goal)
                                    const today = new Date().toISOString().split('T')[0];

                                    // Use RPC to atomically increment chapters_read and duration
                                    await supabase.rpc('increment_daily_reading', {
                                        p_user_id: user.id,
                                        p_date: today,
                                        p_chapters: 1,
                                        p_minutes: 5 // Assume 5 mins per chapter
                                    });

                                    // Fallback/Init if RPC fails or first time (though RPC handles upsert)
                                }

                                // 3. Update User Reading Progress (Daily Goal)
                                // This assumes there's logic on Dashboard to count daily readings.
                                // For now, we just record the activity which triggers dashboard update on refresh.
                            }
                        } catch (e) {
                            console.error('Error recording reading:', e);
                        }

                        if (selectedChapter < getChapterCount(selectedBook)) {
                            setSelectedChapter(selectedChapter + 1);
                        } else {
                            const currentBookIndex = BIBLE_BOOKS.indexOf(selectedBook);
                            if (currentBookIndex < BIBLE_BOOKS.length - 1) {
                                setSelectedBook(BIBLE_BOOKS[currentBookIndex + 1]);
                                setSelectedChapter(1);
                            }
                        }
                        window.scrollTo(0, 0);
                    }}
                    disabled={selectedBook === '요한계시록' && selectedChapter === getChapterCount('요한계시록')}
                    className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    다음
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        </main>

        {/* Book Picker Modal */}
        {showBookPicker && (
            <div className="fixed inset-0 z-[100] bg-black/50 flex items-end backdrop-blur-sm" onClick={() => setShowBookPicker(false)}>
                <div
                    className="w-full bg-white dark:bg-slate-900 rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold">책 선택</h3>
                        <button onClick={() => setShowBookPicker(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 overscroll-contain">
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-slate-500 mb-3 sticky top-0 bg-white dark:bg-slate-900 py-2">구약</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {BIBLE_BOOKS.slice(0, 39).map((book) => (
                                    <button
                                        key={book}
                                        onClick={() => {
                                            setSelectedBook(book);
                                            setSelectedChapter(1);
                                            setShowBookPicker(false);
                                        }}
                                        className={`py-3 px-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${selectedBook === book
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        {book}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-500 mb-3 sticky top-0 bg-white dark:bg-slate-900 py-2">신약</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {BIBLE_BOOKS.slice(39).map((book) => (
                                    <button
                                        key={book}
                                        onClick={() => {
                                            setSelectedBook(book);
                                            setSelectedChapter(1);
                                            setShowBookPicker(false);
                                        }}
                                        className={`py-3 px-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${selectedBook === book
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        {book}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Chapter Picker Modal */}
        {showChapterPicker && (
            <div className="fixed inset-0 z-[100] bg-black/50 flex items-end backdrop-blur-sm" onClick={() => setShowChapterPicker(false)}>
                <div
                    className="w-full bg-white dark:bg-slate-900 rounded-t-3xl max-h-[60vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold">{selectedBook} - 장 선택</h3>
                        <button onClick={() => setShowChapterPicker(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 overscroll-contain">
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: getChapterCount(selectedBook) }, (_, i) => i + 1).map((chapter) => (
                                <button
                                    key={chapter}
                                    onClick={() => {
                                        setSelectedChapter(chapter);
                                        setShowChapterPicker(false);
                                    }}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all active:scale-95 ${selectedChapter === chapter
                                        ? 'bg-primary text-white shadow-md'
                                        : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                >
                                    {chapter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Highlight Action Sheet */}
        {activeVerse && (
            <div
                className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 backdrop-blur-sm"
                onClick={() => {
                    setActiveVerse(null);
                    setIsExpanded(false);
                }}
            >
                <div
                    className={`w-full bg-white dark:bg-[#1C1C1E] rounded-t-[32px] shadow-2xl transition-all duration-300 ease-out flex flex-col ${isExpanded ? 'h-[85vh]' : 'h-auto max-h-[60vh]'
                        }`}
                    onClick={e => e.stopPropagation()}
                    onTouchStart={(e) => setTouchStart(e.touches[0].clientY)}
                    onTouchEnd={(e) => {
                        const endY = e.changedTouches[0].clientY;
                        if (touchStart - endY > 50) setIsExpanded(true); // Swipe Up
                        if (endY - touchStart > 50) {
                            if (isExpanded) setIsExpanded(false); // Collapse
                            else setActiveVerse(null); // Close
                        }
                    }}
                >
                    {/* Drag Handle */}
                    <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsExpanded(!isExpanded)}>
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer hover:bg-slate-300 transition-colors" />
                    </div>

                    <div className="p-6 pb-24 overflow-y-auto flex-1 overscroll-contain">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {selectedBook} {selectedChapter}장 {activeVerse}절
                            </h3>
                            {highlights.find(h => h.verse === activeVerse && h.user_id === user?.id) && (
                                <button
                                    onClick={removeHighlight}
                                    className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full"
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            )}
                        </div>

                        <div className="flex gap-4 mb-4">
                            {['yellow', 'green', 'blue', 'pink'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => handleHighlight(color)}
                                    className={`flex-1 h-14 rounded-2xl flex items-center justify-center transition-transform active:scale-95 ${color === 'yellow' ? 'bg-yellow-400 text-yellow-900' :
                                        color === 'green' ? 'bg-green-400 text-green-900' :
                                            color === 'blue' ? 'bg-blue-400 text-blue-900' :
                                                'bg-pink-400 text-pink-900'
                                        }`}
                                >
                                    <span className="material-symbols-outlined font-bold">format_ink_highlighter</span>
                                </button>
                            ))}
                        </div>

                        {/* Who highlighted */}
                        {highlights.filter(h => h.verse === activeVerse).length > 0 && (
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                                <h4 className="text-sm font-semibold text-slate-500 mb-3">함께 밑줄 친 멤버</h4>
                                <div className="flex flex-wrap gap-2">
                                    {highlights.filter(h => h.verse === activeVerse).map(h => (
                                        <div key={h.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                                            <div className={`w-2 h-2 rounded-full ${h.color === 'yellow' ? 'bg-yellow-400' :
                                                h.color === 'green' ? 'bg-green-400' :
                                                    h.color === 'blue' ? 'bg-blue-400' :
                                                        'bg-pink-400'
                                                }`}></div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {h.user_name || '멤버'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
                <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-t-[32px] p-6 pb-12" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold">화면 설정</h3>
                        <button onClick={() => setShowSettings(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-3">
                                <span className="text-sm font-semibold text-slate-500">글자 크기</span>
                                <span className="text-sm font-bold">{fontSize}px</span>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 rounded-2xl p-2">
                                <button
                                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 shadow-sm"
                                >
                                    <span className="text-xs font-bold">A</span>
                                </button>
                                <div className="flex-1 px-2">
                                    <input
                                        type="range"
                                        min="14"
                                        max="32"
                                        step="2"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        className="w-full accent-primary"
                                    />
                                </div>
                                <button
                                    onClick={() => setFontSize(Math.min(32, fontSize + 2))}
                                    className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 shadow-sm"
                                >
                                    <span className="text-xl font-bold">A</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-3">
                                <span className="text-sm font-semibold text-slate-500">줄 간격</span>
                                <span className="text-sm font-bold">{lineHeight}</span>
                            </div>
                            <div className="flex gap-2">
                                {[1.5, 1.8, 2.0, 2.2].map(lh => (
                                    <button
                                        key={lh}
                                        onClick={() => setLineHeight(lh)}
                                        className={`flex-1 py-3 rounded-xl font-medium transition-colors ${lineHeight === lh
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        {lh}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
);
};

export default BibleScreen;
