'use client';

import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { supabase } from '@/lib/supabase';

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

const BibleScreen: React.FC<BibleScreenProps> = ({ navigate, t }) => {
    const [bibleData, setBibleData] = useState<BibleData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState<string>('창세기');
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    const [showBookPicker, setShowBookPicker] = useState(false);
    const [showChapterPicker, setShowChapterPicker] = useState(false);

    useEffect(() => {
        const loadBible = async () => {
            try {
                const res = await fetch('/bible/ko_krv.json');
                const data = await res.json();
                setBibleData(data);
            } catch (error) {
                console.error('Failed to load Bible data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadBible();

        // localStorage에서 초기 책/장 설정 읽기
        const savedBook = localStorage.getItem('selectedBook');
        const savedChapter = localStorage.getItem('selectedChapter');
        if (savedBook && BIBLE_BOOKS.includes(savedBook)) {
            setSelectedBook(savedBook);
            if (savedChapter) {
                setSelectedChapter(parseInt(savedChapter) || 1);
            }
            // 읽은 후 삭제 (일회성)
            localStorage.removeItem('selectedBook');
            localStorage.removeItem('selectedChapter');
        }
    }, []);

    const getChapterCount = (book: string) => {
        if (!bibleData || !bibleData[book]) return 0;
        return Object.keys(bibleData[book]).length;
    };

    const getVerses = () => {
        if (!bibleData || !bibleData[selectedBook] || !bibleData[selectedBook][selectedChapter.toString()]) {
            return [];
        }
        const chapter = bibleData[selectedBook][selectedChapter.toString()];
        return Object.entries(chapter).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
    };

    if (loading) {
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

                    <button className="p-2 -mr-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-2xl">settings</span>
                    </button>
                </div>
            </header>

            {/* Bible Content */}
            <main className="px-5 py-6">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    {selectedBook} {selectedChapter}장
                </h1>

                <div className="space-y-4">
                    {getVerses().map(([verseNum, text]) => (
                        <div key={verseNum} className="flex gap-3">
                            <span className="text-primary font-bold text-sm min-w-[24px] text-right pt-1">
                                {verseNum}
                            </span>
                            <p className="text-lg leading-relaxed flex-1">
                                {text}
                            </p>
                        </div>
                    ))}
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
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
                    <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold">책 선택</h3>
                            <button onClick={() => setShowBookPicker(false)} className="p-2">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4">
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold text-slate-500 mb-2">구약</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {BIBLE_BOOKS.slice(0, 39).map((book) => (
                                        <button
                                            key={book}
                                            onClick={() => {
                                                setSelectedBook(book);
                                                setSelectedChapter(1);
                                                setShowBookPicker(false);
                                            }}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${selectedBook === book
                                                ? 'bg-primary text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {book}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-slate-500 mb-2">신약</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {BIBLE_BOOKS.slice(39).map((book) => (
                                        <button
                                            key={book}
                                            onClick={() => {
                                                setSelectedBook(book);
                                                setSelectedChapter(1);
                                                setShowBookPicker(false);
                                            }}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${selectedBook === book
                                                ? 'bg-primary text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
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
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
                    <div className="w-full bg-white dark:bg-slate-900 rounded-t-3xl max-h-[60vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold">{selectedBook} - 장 선택</h3>
                            <button onClick={() => setShowChapterPicker(false)} className="p-2">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4">
                            <div className="grid grid-cols-5 gap-2">
                                {Array.from({ length: getChapterCount(selectedBook) }, (_, i) => i + 1).map((chapter) => (
                                    <button
                                        key={chapter}
                                        onClick={() => {
                                            setSelectedChapter(chapter);
                                            setShowChapterPicker(false);
                                        }}
                                        className={`py-3 rounded-lg text-sm font-medium transition-colors ${selectedChapter === chapter
                                            ? 'bg-primary text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
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
        </div>
    );
};

export default BibleScreen;
