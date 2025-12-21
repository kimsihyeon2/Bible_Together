import React, { useEffect, useState, useRef } from 'react';
import { BIBLE_BOOKS, TRANSLATIONS } from '@/lib/constants';

type TranslationText = {
    type: string;
    name: string;
    text: string;
};

type VerseComparisonData = {
    verse: number;
    translations: TranslationText[];
};

interface Props {
    book: string;
    chapter: number;
    verse: number;
    onClose: () => void;
}

export default function VerseComparisonModal({ book, chapter, verse, onClose }: Props) {
    const [chapterData, setChapterData] = useState<VerseComparisonData[]>([]);
    const [loading, setLoading] = useState(true);
    const scrolledRef = useRef(false);

    useEffect(() => {
        const fetchChapterTranslations = async () => {
            setLoading(true);
            const translationKeys = ['KRV', 'KLB', 'EASY'];
            const fileMap: Record<string, string> = {
                'KRV': 'ko_krv.json',
                'KLB': 'ko_klb.json',
                'EASY': 'ko_easy.json'
            };

            // Map standard UI names to JSON keys
            const bookKeyMap: Record<string, string> = {
                '요한일서': '요한1서',
                '요한이서': '요한2서',
                '요한삼서': '요한3서'
            };
            const bookKey = bookKeyMap[book] || book;

            try {
                // Fetch all 3 translations' full data for the book
                const responses = await Promise.all(
                    translationKeys.map(ver => fetch(`/bible/${fileMap[ver]}`).then(res => res.json()))
                );

                const translationsData: Record<string, any> = {};
                translationKeys.forEach((key, index) => {
                    translationsData[key] = responses[index];
                });

                // Get all verses for the chapter from KRV (Primary)
                const krvChapter = translationsData['KRV']?.[bookKey]?.[chapter.toString()];

                if (!krvChapter) {
                    console.error("Chapter not found in KRV");
                    setLoading(false);
                    return;
                }

                // Create combined data structure
                const verseNumbers = Object.keys(krvChapter)
                    .map(Number)
                    .sort((a, b) => a - b);

                const combinedData: VerseComparisonData[] = verseNumbers.map(vNum => {
                    const texts: TranslationText[] = translationKeys.map(ver => {
                        const tName = TRANSLATIONS[ver as keyof typeof TRANSLATIONS].name;
                        const text = translationsData[ver]?.[bookKey]?.[chapter.toString()]?.[vNum.toString()] || "-";

                        return {
                            type: ver,
                            name: tName,
                            text: text
                        };
                    });

                    return {
                        verse: vNum,
                        translations: texts
                    };
                });

                setChapterData(combinedData);

            } catch (e) {
                console.error("Failed to fetch comparisons", e);
            } finally {
                setLoading(false);
            }
        };

        if (book && chapter) {
            fetchChapterTranslations();
        }
    }, [book, chapter]);

    // Auto-scroll to selected verse after data loads
    useEffect(() => {
        if (!loading && chapterData.length > 0 && !scrolledRef.current) {
            const element = document.getElementById(`comparison-verse-${verse}`);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    scrolledRef.current = true;
                }, 100);
            }
        }
    }, [loading, chapterData, verse]);

    return (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-t-3xl sm:rounded-t-2xl z-10">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                            역본 비교
                        </h3>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">
                            {book} {chapter}장 (전체)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 overscroll-contain bg-slate-50 dark:bg-black/20">
                    {loading ? (
                        <div className="p-6 space-y-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse space-y-3">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                                            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 flex-shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                                            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {chapterData.map((data) => (
                                <div
                                    key={data.verse}
                                    id={`comparison-verse-${data.verse}`}
                                    className={`p-5 transition-colors duration-500 ${data.verse === verse
                                            ? 'bg-yellow-50/80 dark:bg-yellow-900/10 ring-1 ring-inset ring-yellow-400/30'
                                            : 'hover:bg-white dark:hover:bg-slate-900/50'
                                        }`}
                                >
                                    <div className="flex gap-4">
                                        {/* Verse Number Column */}
                                        <div className="flex-shrink-0 pt-1">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                                ${data.verse === verse
                                                    ? 'bg-primary text-white shadow-md scale-110'
                                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}
                                            `}>
                                                {data.verse}
                                            </div>
                                        </div>

                                        {/* Translations Column */}
                                        <div className="flex-1 space-y-6">
                                            {data.translations.map((t) => (
                                                <div key={t.type} className="relative pl-3 border-l-2 border-slate-200 dark:border-slate-700">
                                                    <h5 className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${t.type === 'KRV' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                t.type === 'KLB' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                            }`}>
                                                            {t.name}
                                                        </span>
                                                    </h5>
                                                    <p className="text-[17px] leading-relaxed text-slate-700 dark:text-slate-300">
                                                        {t.text}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="p-8 text-center">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            모든 번역본의 저작권은 각 저작권자에게 있습니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
