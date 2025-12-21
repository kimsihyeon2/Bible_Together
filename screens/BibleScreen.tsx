'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Screen } from '../types';
import { Translations } from '../i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useBible, BibleTranslation, TRANSLATIONS } from '@/lib/bible-context';
import { useAudio } from '@/lib/audio-context';
import { saveReadingProgress, getUserCellId } from '@/lib/reading-progress';

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
    const { isLoaded, getVerses: getVersesFromContext, getChapterCount: getChapterCountFromContext, currentTranslation, setTranslation } = useBible();
    const { user, profile } = useAuth();
    const { playChapter, isPlaying, currentBook, currentChapter, currentTime, duration } = useAudio();
    // const [bibleData, setBibleData] = useState<BibleData | null>(null); // Removed
    const [loading, setLoading] = useState(true); // Kept for initial setup
    const [selectedBook, setSelectedBook] = useState<string>('창세기');
    const [selectedChapter, setSelectedChapter] = useState<number>(1);
    const [showBookPicker, setShowBookPicker] = useState(false);
    const [showChapterPicker, setShowChapterPicker] = useState(false);

    // New State for Settings & Highlights
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState(18);
    const [lineHeight, setLineHeight] = useState(1.8);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [activeVerse, setActiveVerse] = useState<number | null>(null);
    const [playingVerse, setPlayingVerse] = useState<number | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [touchStart, setTouchStart] = useState(0);
    const lastScrollTime = useRef<number>(0);
    const estimatedVerseRef = useRef<number>(1);

    // Load Settings
    useEffect(() => {
        const savedFontSize = localStorage.getItem('bibleFontSize');
        if (savedFontSize) setFontSize(parseInt(savedFontSize));
        const savedLineHeight = localStorage.getItem('bibleLineHeight');
        if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
    }, []);

    // Save Settings
    useEffect(() => {
        localStorage.setItem('bibleFontSize', fontSize.toString());
        localStorage.setItem('bibleLineHeight', lineHeight.toString());
    }, [fontSize, lineHeight]);

    // Fetch Highlights
    useEffect(() => {
        if (user && selectedBook && selectedChapter) {
            fetchHighlights();
        }
    }, [user, selectedBook, selectedChapter]);

    const fetchHighlights = async () => {
        if (!user) return;

        try {
            // 1. Get my Cell ID
            const { data: myCell } = await supabase
                .from('cell_members')
                .select('cell_id')
                .eq('user_id', user.id)
                .maybeSingle();

            let memberIds = [user.id];

            if (myCell) {
                // 2. Get all members of this cell
                const { data: members } = await supabase
                    .from('cell_members')
                    .select('user_id')
                    .eq('cell_id', myCell.cell_id);

                if (members) {
                    memberIds = members.map((m: { user_id: string }) => m.user_id);
                }
            }

            // 3. Fetch Highlights
            const { data, error } = await supabase
                .from('bible_highlights')
                .select('*, profiles(name)')
                .eq('book', selectedBook)
                .eq('chapter', selectedChapter)
                .in('user_id', memberIds);

            if (error) throw error;

            // Transform data to flatten profile name
            const robustData = data?.map((h: any) => ({
                ...h,
                user_name: (h.profiles as any)?.name || '알 수 없음'
            })) || [];

            setHighlights(robustData);

        } catch (error) {
            console.error('Error fetching highlights:', error);
        }
    };

    const handleHighlight = async (color: string) => {
        if (!user || !activeVerse) return;
        const myHighlight = highlights.find(h => h.verse === activeVerse && h.user_id === user.id);

        if (myHighlight) {
            await supabase.from('bible_highlights').update({ color }).eq('id', myHighlight.id);
        } else {
            await supabase.from('bible_highlights').insert({
                user_id: user.id,
                book: selectedBook,
                chapter: selectedChapter,
                verse: activeVerse,
                color,
                content: ''
            });
        }
        setActiveVerse(null);
        fetchHighlights();
    };

    const removeHighlight = async () => {
        if (!user || !activeVerse) return;
        await supabase.from('bible_highlights').delete()
            .eq('user_id', user.id)
            .eq('book', selectedBook)
            .eq('chapter', selectedChapter)
            .eq('verse', activeVerse);
        setActiveVerse(null);
        fetchHighlights();
    };

    useEffect(() => {
        // Priority 1: Explicit selection from other screens (e.g. PlanDetailScreen)
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
            return;
        }

        // Priority 2: Continue reading - load next chapter after last read
        const lastReadBook = localStorage.getItem('lastReadBook');
        const lastReadChapter = localStorage.getItem('lastReadChapter');
        if (lastReadBook && BIBLE_BOOKS.includes(lastReadBook) && lastReadChapter) {
            const lastChapter = parseInt(lastReadChapter) || 1;
            const maxChapters = getChapterCountFromContext(lastReadBook);

            setSelectedBook(lastReadBook);
            // Go to NEXT chapter (continue reading)
            if (lastChapter < maxChapters) {
                setSelectedChapter(lastChapter + 1);
            } else {
                // Already read last chapter, show that chapter
                setSelectedChapter(lastChapter);
            }
        }
        // Otherwise: Keep default (창세기 1장)
    }, [getChapterCountFromContext]);

    // Wait for Bible Load
    useEffect(() => {
        if (isLoaded) {
            setLoading(false);
        }
    }, [isLoaded]);

    // SOTA Adaptive Verse Sync Logic v2.0 - Improved Algorithm
    // Features: Verse-boundary padding, adaptive character weighting, smooth interpolation
    useEffect(() => {
        if (!isPlaying || currentBook !== selectedBook || currentChapter !== selectedChapter || duration === 0) {
            setPlayingVerse(null);
            estimatedVerseRef.current = 1;
            return;
        }

        const verses = getVerses();
        if (verses.length === 0) return;

        // ====== SOTA ALGORITHM: Verse Timing Estimation ======
        // Audio structure: [Intro: "창세기 X장" ~4초] → [절 1] → [절 2] → ...
        const INTRO_DELAY_SECONDS = 4.0;  // Chapter announcement at start ("창세기 X장")
        const VERSE_PAUSE_SECONDS = 1.2;  // Average pause between verses
        const CHARS_PER_SECOND = 5.5;     // Average Korean reading speed

        // Calculate estimated time for each verse
        const verseTiming = verses.map(([verseNum, text]) => {
            const charTime = text.length / CHARS_PER_SECOND;
            const totalTime = charTime + VERSE_PAUSE_SECONDS;
            return {
                verseNum: parseInt(verseNum),
                text,
                charCount: text.length,
                estimatedDuration: totalTime
            };
        });

        // Calculate total estimated time (intro + all verses)
        const totalVerseTime = verseTiming.reduce((sum, v) => sum + v.estimatedDuration, 0);
        const totalEstimatedTime = INTRO_DELAY_SECONDS + totalVerseTime;

        // Scale factor to match actual audio duration
        const scaleFactor = duration / totalEstimatedTime;
        const scaledIntroDelay = INTRO_DELAY_SECONDS * scaleFactor;

        // Build timeline with start/end times (starting AFTER intro)
        let currentStart = scaledIntroDelay; // First verse starts after intro!
        const timeline = verseTiming.map(v => {
            const scaledDuration = v.estimatedDuration * scaleFactor;
            const entry = {
                ...v,
                startTime: currentStart,
                endTime: currentStart + scaledDuration
            };
            currentStart = entry.endTime;
            return entry;
        });

        // Find current verse based on audio time
        // During intro period (before scaledIntroDelay), targetVerse stays at 1 but won't scroll
        let targetVerse = 1;
        if (currentTime >= scaledIntroDelay) {
            for (const entry of timeline) {
                if (currentTime >= entry.startTime && currentTime < entry.endTime) {
                    targetVerse = entry.verseNum;
                    break;
                }
                if (currentTime >= entry.startTime) {
                    targetVerse = entry.verseNum;
                }
            }
        }

        // ====== SMOOTHING LOGIC ======
        // Allow backward movement only if difference > 3 verses (user seeked)
        const currentEstimate = estimatedVerseRef.current;
        let smoothedVerse = targetVerse;

        if (targetVerse < currentEstimate) {
            // Only go backward if significant jump (likely user seeked)
            if (currentEstimate - targetVerse > 3) {
                smoothedVerse = targetVerse;
            } else {
                // Stay at current (small fluctuation)
                smoothedVerse = currentEstimate;
            }
        }

        // ====== SCROLL UPDATE ======
        // Throttle scroll to prevent jitter (minimum 600ms between scrolls)
        const now = Date.now();
        const timeSinceLastScroll = now - lastScrollTime.current;
        const MIN_SCROLL_INTERVAL = 600;

        if (smoothedVerse !== playingVerse && timeSinceLastScroll > MIN_SCROLL_INTERVAL) {
            estimatedVerseRef.current = smoothedVerse;
            setPlayingVerse(smoothedVerse);
            lastScrollTime.current = now;

            // Smooth auto-scroll with offset for better readability
            // Position the playing verse at ~30% from top
            const element = document.getElementById(`verse-${smoothedVerse}`);
            if (element) {
                const viewportHeight = window.innerHeight;
                const headerHeight = 80;
                const targetOffset = viewportHeight * 0.25; // 25% from top
                const elementRect = element.getBoundingClientRect();
                const absoluteTop = elementRect.top + window.scrollY;
                const scrollTarget = absoluteTop - headerHeight - targetOffset;

                window.scrollTo({
                    top: Math.max(0, scrollTarget),
                    behavior: 'smooth'
                });
            }
        }
    }, [currentTime, duration, isPlaying, currentBook, currentChapter, selectedBook, selectedChapter, playingVerse]);

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
                {/* Horizontal Scroll Container */}
                <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar whitespace-nowrap mask-linear-fade">
                    <button
                        onClick={() => navigate(Screen.DASHBOARD)}
                        className="flex-shrink-0 p-2 -ml-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-sub-light dark:text-text-sub-dark"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>

                    {/* Book selector */}
                    <button
                        onClick={() => setShowBookPicker(true)}
                        className="flex-shrink-0 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold flex items-center gap-1 transition-transform active:scale-95"
                    >
                        {selectedBook}
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>

                    {/* Chapter selector */}
                    <button
                        onClick={() => setShowChapterPicker(true)}
                        className="flex-shrink-0 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-semibold flex items-center gap-1 transition-transform active:scale-95"
                    >
                        {selectedChapter}장
                        <span className="material-symbols-outlined text-lg">expand_more</span>
                    </button>

                    {/* Spacer to push controls to right if space permits, otherwise they flow */}
                    <div className="flex-grow min-w-[10px]"></div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Audio Button */}
                        <button
                            onClick={() => playChapter(selectedBook, selectedChapter)}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors relative"
                        >
                            <span className={`material-symbols-outlined text-2xl ${isPlaying && currentBook === selectedBook && currentChapter === selectedChapter
                                ? 'text-primary'
                                : ''
                                }`}>
                                headphones
                            </span>
                            {/* Equalizer animation when playing this chapter */}
                            {isPlaying && currentBook === selectedBook && currentChapter === selectedChapter && (
                                <span className="absolute top-2 right-2 flex gap-0.5 items-end h-3">
                                    <span className="w-0.5 bg-primary animate-[bounce_1s_infinite] h-2"></span>
                                    <span className="w-0.5 bg-primary animate-[bounce_1.2s_infinite] h-3"></span>
                                    <span className="w-0.5 bg-primary animate-[bounce_0.8s_infinite] h-1.5"></span>
                                </span>
                            )}
                        </button>

                        {/* Translation Toggle */}
                        <button
                            onClick={() => {
                                // Cycle through: KRV → KLB → EASY → KRV
                                const order: BibleTranslation[] = ['KRV', 'KLB', 'EASY'];
                                const currentIndex = order.indexOf(currentTranslation);
                                const nextIndex = (currentIndex + 1) % order.length;
                                setTranslation(order[nextIndex]);
                            }}
                            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
                            title={`현재: ${TRANSLATIONS[currentTranslation].name}`}
                        >
                            <span className="material-symbols-outlined text-lg">translate</span>
                            <span className={currentTranslation !== 'KRV' ? 'text-primary' : ''}>
                                {TRANSLATIONS[currentTranslation].name.slice(0, 3)}
                            </span>
                        </button>

                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 -mr-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                        >
                            <span className="material-symbols-outlined text-2xl">settings</span>
                        </button>
                    </div>
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
                                id={`verse-${verseNum}`}
                                className={`flex gap-3 py-1 px-2 rounded-lg transition-colors cursor-pointer ${primaryHighlight ? bgColor : 'hover:bg-slate-50 dark:hover:bg-white/5'} ${playingVerse === verseNum ? 'bg-primary/5' : ''}`}
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
                                        <span className={`${primaryHighlight ? borderColor : ''} border-b-0 ${playingVerse === verseNum ? 'bg-yellow-200/50 dark:bg-yellow-500/30 px-1 rounded transition-colors duration-500' : ''}`}>
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
                        onClick={() => {
                            // 1. Optimistic Navigation (Immediate UI Update)
                            const nextChapter = selectedChapter + 1;
                            const currentBookCount = getChapterCount(selectedBook);
                            let hasNext = true;

                            if (nextChapter <= currentBookCount) {
                                setSelectedChapter(nextChapter);
                            } else {
                                const currentBookIndex = BIBLE_BOOKS.indexOf(selectedBook);
                                if (currentBookIndex < BIBLE_BOOKS.length - 1) {
                                    setSelectedBook(BIBLE_BOOKS[currentBookIndex + 1]);
                                    setSelectedChapter(1);
                                } else {
                                    hasNext = false;
                                }
                            }

                            if (hasNext) {
                                window.scrollTo(0, 0);
                                setActiveVerse(null); // Reset active verse
                            }

                            // 2. Save reading progress (Fire and Forget)
                            (async () => {
                                try {
                                    if (user && profile) {
                                        const cellId = await getUserCellId(user.id);
                                        await saveReadingProgress(
                                            user.id,
                                            profile.name || '익명',
                                            selectedBook,
                                            selectedChapter,
                                            'TEXT',
                                            cellId || undefined
                                        );
                                    }
                                } catch (e) {
                                    console.error('Error recording reading:', e);
                                }
                            })();
                        }}
                        disabled={selectedBook === '요한계시록' && selectedChapter === getChapterCount('요한계시록')}
                        className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-transform"
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
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
                    <div className="w-full bg-white dark:bg-[#1C1C1E] rounded-t-[32px] p-6 pb-32 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/50 dark:bg-[#1C1C1E]/50 backdrop-blur-md -mx-6 px-6 py-2 z-10">
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
